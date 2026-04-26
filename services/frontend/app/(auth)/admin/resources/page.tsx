import { ResourceList } from "@/src/widgets/resource-list/resource-list";

export default function AdminResourcesPage() {
	return (
		<div className="container py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Управление ресурсами</h1>
			</div>
			<ResourceList />
		</div>
	);
}
