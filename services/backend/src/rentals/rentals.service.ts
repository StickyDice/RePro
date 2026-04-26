import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { RentalRequestStatus, UserStatus } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { CALENDAR_PROVIDER } from "@/calendar/calendar.constants";
import type { CalendarProvider } from "@/calendar/calendar-provider.interface";
import { NotificationService } from "@/notifications/notification.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ResourceAccessService } from "@/resources/resource-access.service";
import { ResourcesService } from "@/resources/resources.service";
import { TenantContextService } from "@/tenant-context/tenant-context.service";
import type { CreateRentalDto } from "./dto/create-rental.dto";

@Injectable()
export class RentalsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly tenantContext: TenantContextService,
		private readonly resourceAccess: ResourceAccessService,
		private readonly resourcesService: ResourcesService,
		private readonly notificationService: NotificationService,
		private readonly auditService: AuditService,
		@Inject(CALENDAR_PROVIDER) private readonly calendarProvider: CalendarProvider,
	) {}

	private getCompanyId(): string {
		return this.tenantContext.requireCompanyId();
	}

	private getUserId(): string {
		return this.tenantContext.requireUserId();
	}

	private hasSupportRole(): boolean {
		const membership = this.tenantContext.getMembership();
		return (membership?.role?.priority ?? 0) >= 20; // ROLE_PRIORITIES.support
	}

	private assertCompanyContext(companyId: string): void {
		const contextCompanyId = this.tenantContext.getCompanyId();
		if (contextCompanyId !== companyId) {
			throw new ForbiddenException(
				"ID компании в пути не совпадает с активным контекстом компании",
			);
		}
	}

	async getMyRentals(companyId: string) {
		this.assertCompanyContext(companyId);
		const userId = this.getUserId();

		const rentals = await this.prisma.rentalRequest.findMany({
			where: { company_id: companyId, user_id: userId },
			include: {
				resource: true,
				processed_by_user: {
					select: { id: true, email: true, first_name: true, last_name: true },
				},
			},
			orderBy: { created_at: "desc" },
		});

		return { rentals };
	}

	async listRentals(
		companyId: string,
		status?: "pending" | "approved" | "rejected" | "cancelled" | "completed",
	) {
		this.assertCompanyContext(companyId);

		const where: { company_id: string; status?: RentalRequestStatus } = {
			company_id: companyId,
		};
		if (status) {
			where.status = status as RentalRequestStatus;
		} else {
			where.status = RentalRequestStatus.pending;
		}

		const rentals = await this.prisma.rentalRequest.findMany({
			where,
			include: {
				resource: true,
				user: {
					select: { id: true, email: true, first_name: true, last_name: true },
				},
				processed_by_user: {
					select: { id: true, email: true, first_name: true, last_name: true },
				},
			},
			orderBy: { created_at: "desc" },
		});

		return { rentals };
	}

	async createRental(companyId: string, dto: CreateRentalDto, userId: string) {
		this.assertCompanyContext(companyId);

		// User with pending_verification cannot create rentals
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});
		if (!user || user.status === UserStatus.pending_verification) {
			throw new ForbiddenException(
				"Ваш аккаунт должен быть подтверждён перед созданием заявок на бронирование",
			);
		}

		const resource = await this.prisma.resource.findFirst({
			where: {
				id: dto.resource_id,
				company_id: companyId,
				is_active: true,
			},
		});

		if (!resource) {
			throw new NotFoundException("Ресурс не найден");
		}

		const canAccess = await this.resourceAccess.canUserAccessResource(
			userId,
			dto.resource_id,
			companyId,
		);
		if (!canAccess) {
			throw new ForbiddenException("У вас нет доступа к этому ресурсу");
		}

		const startAt = new Date(dto.requested_start_at);
		const endAt = new Date(dto.requested_end_at);

		if (startAt >= endAt) {
			throw new ForbiddenException(
				"Дата окончания должна быть позже даты начала",
			);
		}

		const isAvailable =
			await this.resourcesService.checkResourceAvailableForRange(
				companyId,
				dto.resource_id,
				startAt,
				endAt,
			);
		if (!isAvailable) {
			throw new ConflictException(
				"Ресурс недоступен в выбранном диапазоне дат",
			);
		}

		const rental = await this.prisma.rentalRequest.create({
			data: {
				company_id: companyId,
				resource_id: dto.resource_id,
				user_id: userId,
				requested_start_at: startAt,
				requested_end_at: endAt,
				request_comment: dto.comment ?? null,
				status: RentalRequestStatus.pending,
			},
			include: {
				resource: true,
			},
		});

		return { rental };
	}

	async getRental(companyId: string, rentalId: string) {
		this.assertCompanyContext(companyId);
		const userId = this.getUserId();

		const rental = await this.prisma.rentalRequest.findFirst({
			where: { id: rentalId, company_id: companyId },
			include: {
				resource: true,
				user: {
					select: { id: true, email: true, first_name: true, last_name: true },
				},
				processed_by_user: {
					select: { id: true, email: true, first_name: true, last_name: true },
				},
			},
		});

		if (!rental) {
			throw new NotFoundException("Заявка на бронирование не найдена");
		}

		const isOwner = rental.user_id === userId;
		const isSupport = this.hasSupportRole();

		if (!isOwner && !isSupport) {
			throw new ForbiddenException(
				"У вас нет доступа к этой заявке на бронирование",
			);
		}

		return { rental };
	}

	async approveRental(
		companyId: string,
		rentalId: string,
		decisionComment: string | undefined,
		processedByUserId: string,
	) {
		this.assertCompanyContext(companyId);

		const rental = await this.prisma.rentalRequest.findFirst({
			where: { id: rentalId, company_id: companyId },
			include: { user: true, resource: true },
		});

		if (!rental) {
			throw new NotFoundException("Заявка на бронирование не найдена");
		}

		if (rental.status !== RentalRequestStatus.pending) {
			throw new ConflictException(`Заявка уже имеет статус: ${rental.status}`);
		}

		// Transaction: re-validate availability, create allocation, update request
		const result = await this.prisma.$transaction(async (tx) => {
			const isAvailable =
				await this.resourcesService.checkResourceAvailableForRange(
					companyId,
					rental.resource_id,
					rental.requested_start_at,
					rental.requested_end_at,
					tx,
				);

			if (!isAvailable) {
				throw new ConflictException(
					"Ресурс больше недоступен в выбранном диапазоне дат",
				);
			}

			const [allocation, updated] = await Promise.all([
				tx.rentalAllocation.create({
					data: {
						company_id: companyId,
						resource_id: rental.resource_id,
						rental_request_id: rentalId,
						start_at: rental.requested_start_at,
						end_at: rental.requested_end_at,
						quantity_reserved: 1,
					},
				}),
				tx.rentalRequest.update({
					where: { id: rentalId },
					data: {
						status: RentalRequestStatus.approved,
						decision_comment: decisionComment ?? null,
						processed_by: processedByUserId,
						processed_at: new Date(),
					},
					include: {
						resource: true,
						user: true,
						processed_by_user: true,
					},
				}),
			]);

			return { allocation, updated };
		});

		// Create calendar event and store google_event_id
		const recipientEmail = rental.user.email;
		if (recipientEmail) {
			try {
				const company = await this.prisma.company.findUnique({
					where: { id: companyId },
					select: { name: true },
				});
				const eventId = await this.calendarProvider.createEvent({
					resourceName: rental.resource.name,
					startAt: rental.requested_start_at,
					endAt: rental.requested_end_at,
					userEmail: recipientEmail,
					companyName: company?.name ?? "Неизвестная компания",
					comment: rental.request_comment ?? undefined,
				});
				if (eventId) {
					await this.prisma.rentalAllocation.update({
						where: { id: result.allocation.id },
						data: { google_event_id: eventId },
					});
				}
			} catch (err) {
				console.warn("[RentalsService] Failed to create calendar event:", err);
			}
		}

		// NotificationService stub
		if (recipientEmail) {
			this.notificationService.sendEmail(
				recipientEmail,
				"Заявка на бронирование одобрена",
				"rental_approved",
				{
					rental_id: rentalId,
					resource_name: rental.resource.name,
					start_at: rental.requested_start_at,
					end_at: rental.requested_end_at,
					decision_comment: decisionComment,
				},
			);
		}

		// AuditService
		await this.auditService.log(
			companyId,
			processedByUserId,
			"rental_approved",
			"RentalRequest",
			rentalId,
			{
				resource_id: rental.resource_id,
				user_id: rental.user_id,
				decision_comment: decisionComment,
			},
		);

		return { rental: result.updated };
	}

	async rejectRental(
		companyId: string,
		rentalId: string,
		decisionComment: string | undefined,
		processedByUserId: string,
	) {
		this.assertCompanyContext(companyId);

		const rental = await this.prisma.rentalRequest.findFirst({
			where: { id: rentalId, company_id: companyId },
			include: { user: true, resource: true },
		});

		if (!rental) {
			throw new NotFoundException("Заявка на бронирование не найдена");
		}

		if (rental.status !== RentalRequestStatus.pending) {
			throw new ConflictException(`Заявка уже имеет статус: ${rental.status}`);
		}

		const updated = await this.prisma.rentalRequest.update({
			where: { id: rentalId },
			data: {
				status: RentalRequestStatus.rejected,
				decision_comment: decisionComment ?? null,
				processed_by: processedByUserId,
				processed_at: new Date(),
			},
			include: {
				resource: true,
				user: true,
				processed_by_user: true,
			},
		});

		// NotificationService stub
		const recipientEmail = rental.user.email;
		if (recipientEmail) {
			this.notificationService.sendEmail(
				recipientEmail,
				"Заявка на бронирование отклонена",
				"rental_rejected",
				{
					rental_id: rentalId,
					resource_name: rental.resource.name,
					decision_comment: decisionComment,
				},
			);
		}

		// AuditService
		await this.auditService.log(
			companyId,
			processedByUserId,
			"rental_rejected",
			"RentalRequest",
			rentalId,
			{
				resource_id: rental.resource_id,
				user_id: rental.user_id,
				decision_comment: decisionComment,
			},
		);

		return { rental: updated };
	}

	async cancelRental(companyId: string, rentalId: string) {
		this.assertCompanyContext(companyId);
		const userId = this.getUserId();

		const rental = await this.prisma.rentalRequest.findFirst({
			where: { id: rentalId, company_id: companyId },
		});

		if (!rental) {
			throw new NotFoundException("Заявка на бронирование не найдена");
		}

		const isOwner = rental.user_id === userId;
		const isSupport = this.hasSupportRole();

		if (!isOwner && !isSupport) {
			throw new ForbiddenException(
				"Вы можете отменять только свои ожидающие заявки, а поддержка может отменять любые",
			);
		}

		if (isOwner && rental.status !== RentalRequestStatus.pending) {
			throw new ForbiddenException(
				"Вы можете отменять только свои ожидающие заявки",
			);
		}

		// If cancelling an approved rental: delete calendar events and allocations
		if (rental.status === RentalRequestStatus.approved) {
			const allocations = await this.prisma.rentalAllocation.findMany({
				where: { rental_request_id: rentalId },
			});
			for (const alloc of allocations) {
				if (alloc.google_event_id) {
					try {
						await this.calendarProvider.deleteEvent(alloc.google_event_id);
					} catch (err) {
						console.warn(
							"[RentalsService] Failed to delete calendar event:",
							err,
						);
					}
				}
			}
			await this.prisma.rentalAllocation.deleteMany({
				where: { rental_request_id: rentalId },
			});
		}

		const updated = await this.prisma.rentalRequest.update({
			where: { id: rentalId },
			data: { status: RentalRequestStatus.cancelled },
			include: {
				resource: true,
				user: true,
			},
		});

		return { rental: updated };
	}
}
