#!/usr/bin/env python3
"""Add anchors and cross-reference links for tables and figures in VKR chapters."""

import re
import sys
from pathlib import Path

TABLE_CAPTION = re.compile(r"^(Таблица (\d+)\.(\d+) — .+)$")
FIGURE_CAPTION = re.compile(r"^(Рисунок (\d+)\.(\d+) — .+)$")
FIGURE_PLACEHOLDER = re.compile(
    r"^(\*\*)?(Место для (?:вставки )?рисунка (\d+)\.(\d+) — .+?)(\*\*)?$"
)
MERMAID_BLOCK = re.compile(r"```mermaid\n.*?\n```", re.DOTALL)

LINK_TABLE = re.compile(
    r"(?<!\]\(#table-)(?<!\[)(?<![\w-])(таблиц[аеу]|Таблица) (\d+)\.(\d+)(?!\]\(#)",
    re.IGNORECASE,
)
LINK_FIGURE = re.compile(
    r"(?<!\]\(#fig-)(?<!\[)(?<![\w-])(рисунк[аеу]|рис\.|Рисунок) (\d+)\.(\d+)(?!\]\(#)",
    re.IGNORECASE,
)


def anchor_id(kind: str, ch: str, num: str) -> str:
    return f"{kind}-{ch}-{num}"


def move_figure_captions(content: str) -> str:
    """Move 'Рисунок X.Y' captions from after mermaid to before mermaid."""
    lines = content.split("\n")
    result: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("```mermaid"):
            block_start = i
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                i += 1
            if i < len(lines):
                i += 1  # closing ```
            block_end = i

            caption_idx = block_end
            while caption_idx < len(lines) and not lines[caption_idx].strip():
                caption_idx += 1

            if caption_idx < len(lines):
                cap_match = FIGURE_CAPTION.match(lines[caption_idx].strip())
                if cap_match:
                    caption_line = cap_match.group(1)
                    ch, num = cap_match.group(2), cap_match.group(3)
                    aid = anchor_id("fig", ch, num)
                    result.append(f'<a id="{aid}"></a>')
                    result.append(caption_line)
                    result.append("")
                    result.extend(lines[block_start:block_end])
                    i = caption_idx + 1
                    continue

        result.append(line)
        i += 1
    return "\n".join(result)


def add_table_anchors(content: str) -> str:
    lines = content.split("\n")
    result: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = TABLE_CAPTION.match(line.strip())
        if m and not (result and result[-1].startswith('<a id="table-')):
            ch, num = m.group(2), m.group(3)
            aid = anchor_id("table", ch, num)
            if not (result and f'id="{aid}"' in result[-1]):
                result.append(f'<a id="{aid}"></a>')
            result.append(m.group(1))
            i += 1
            continue
        result.append(line)
        i += 1
    return "\n".join(result)


def add_figure_placeholder_anchors(content: str) -> str:
    lines = content.split("\n")
    result: list[str] = []
    for line in lines:
        m = FIGURE_PLACEHOLDER.match(line.strip())
        if m:
            ch, num = m.group(3), m.group(4)
            aid = anchor_id("fig", ch, num)
            prefix = m.group(1) or ""
            suffix = "**" if line.strip().endswith("**") and not prefix else ""
            text = m.group(2)
            if prefix == "**":
                result.append(f'<a id="{aid}"></a>')
                result.append(f"**{text}**")
            else:
                result.append(f'<a id="{aid}"></a>')
                result.append(text)
            continue
        result.append(line)
    return "\n".join(result)


def linkify_references(content: str) -> str:
    def repl_table(m: re.Match) -> str:
        word, ch, num = m.group(1), m.group(2), m.group(3)
        aid = anchor_id("table", ch, num)
        # preserve capitalization for "Таблица" at sentence start
        display = f"{word} {ch}.{num}"
        return f"[{display}](#{aid})"

    def repl_figure(m: re.Match) -> str:
        word, ch, num = m.group(1), m.group(2), m.group(3)
        aid = anchor_id("fig", ch, num)
        display = f"{word} {ch}.{num}"
        return f"[{display}](#{aid})"

    # Skip lines that are captions or anchors
    lines = content.split("\n")
    out: list[str] = []
    for line in lines:
        if line.startswith('<a id="') or TABLE_CAPTION.match(line.strip()) or FIGURE_CAPTION.match(line.strip()):
            out.append(line)
            continue
        if FIGURE_PLACEHOLDER.match(line.strip()):
            out.append(line)
            continue
        # Don't linkify inside existing markdown links
        if re.search(r"\]\(#(?:table|fig)-", line):
            out.append(line)
            continue
        line = LINK_TABLE.sub(repl_table, line)
        line = LINK_FIGURE.sub(repl_figure, line)
        out.append(line)
    return "\n".join(out)


def add_missing_intro_refs(content: str) -> str:
    """Add introductory cross-reference sentences where tables/figures lack text refs."""
    intros = {
        "table-1-1": "Эволюция подходов к управлению внутренними ресурсами компаний представлена в [таблице 1.1](#table-1-1).",
        "fig-1-1": "Схематично этот переход показан на [рисунке 1.1](#fig-1-1).",
        "table-1-2": "Сравнительная характеристика концепций программных решений приведена в [таблице 1.2](#table-1-2).",
        "fig-1-2": "Логическая модель multi-tenancy для SaaS-платформы показана на [рисунке 1.2](#fig-1-2).",
        "table-1-3": "Сводное описание методологических и архитектурных подходов приведено в [таблице 1.3](#table-1-3).",
        "table-1-4": "Сравнение вариантов организации multi-tenant архитектуры данных представлено в [таблице 1.4](#table-1-4).",
        "fig-1-3": "Сравнение физической и логической изоляции данных показано на [рисунке 1.3](#fig-1-3).",
        "table-1-5": "Сводная оценка применимости теоретических подходов приведена в [таблице 1.5](#table-1-5).",
        "fig-1-4": "Состав теоретической модели собственного исследования представлен на [рисунке 1.4](#fig-1-4).",
        "table-1-6": "Теоретические аспекты информационной безопасности систематизированы в [таблице 1.6](#table-1-6).",
        "fig-1-5": "Уровни проверки безопасности при выполнении пользовательского действия показаны на [рисунке 1.5](#fig-1-5).",
        "table-2-1": "Участники процесса управления и бронирования внутренних ресурсов представлены в [таблице 2.1](#table-2-1).",
        "table-2-2": "Типы внутренних ресурсов и их ключевые атрибуты приведены в [таблице 2.2](#table-2-2).",
        "fig-2-1": "Диаграмма состояний жизненного цикла бронирования представлена на [рисунке 2.1](#fig-2-1).",
        "table-2-3": "Типичные проблемы учета ресурсов и требования к автоматизации систематизированы в [таблице 2.3](#table-2-3).",
        "fig-2-2": "Причинно-следственная схема низкой эффективности управления ресурсами показана на [рисунке 2.2](#fig-2-2).",
        "table-2-4": "Сравнительная оценка классов решений приведена в [таблице 2.4](#table-2-4).",
        "table-2-5": "Результаты SWOT-анализа SaaS-модели представлены в [таблице 2.5](#table-2-5).",
        "table-2-6": "Перечень функциональных требований к платформе приведен в [таблице 2.6](#table-2-6).",
        "table-2-7": "Перечень нефункциональных требований представлен в [таблице 2.7](#table-2-7).",
        "table-2-8": "Матрица прав доступа по ролям приведена в [таблице 2.8](#table-2-8).",
        "fig-2-3": "Логическая схема клиент-серверной архитектуры показана на [рисунке 2.3](#fig-2-3).",
        "table-2-9": "Обоснование выбора технологических компонентов приведено в [таблице 2.9](#table-2-9).",
        "fig-2-4": "Концептуальная ER-диаграмма SaaS-платформы представлена на [рисунке 2.4](#fig-2-4).",
        "fig-2-5": "DFD уровня 0 для процесса бронирования ресурса показана на [рисунке 2.5](#fig-2-5).",
        "fig-2-6": "Диаграмма последовательности создания бронирования представлена на [рисунке 2.6](#fig-2-6).",
        "fig-2-7": "Блок-схема алгоритма создания бронирования показана на [рисунке 2.7](#fig-2-7).",
        "fig-2-8": "BPMN-представление процесса создания бронирования приведено на [рисунке 2.8](#fig-2-8).",
        "table-2-10": "Основные бизнес-правила процесса бронирования систематизированы в [таблице 2.10](#table-2-10).",
        "fig-2-9": "Последовательность применения бизнес-правил показана на [рисунке 2.9](#fig-2-9).",
        "fig-2-10": "UML use-case модель платформы представлена на [рисунке 2.10](#fig-2-10).",
        "table-2-11": "Спецификация основных вариантов использования приведена в [таблице 2.11](#table-2-11).",
        "table-2-12": "Словарь данных основных сущностей представлен в [таблице 2.12](#table-2-12).",
        "table-2-13": "Перечень статусов ресурсов и бронирований приведен в [таблице 2.13](#table-2-13).",
        "table-3-1": "Выбранный стек технологий и назначение компонентов приведены в [таблице 3.1](#table-3-1).",
        "fig-3-2": "Структура каталогов проекта показана на [рисунке 3.2](#fig-3-2).",
        "table-3-2": "Связь реализованных модулей с функциональными требованиями представлена в [таблице 3.2](#table-3-2).",
        "fig-3-3": "ER-диаграмма реализованной базы данных представлена на [рисунке 3.3](#fig-3-3).",
        "fig-3-5": "Обработка tenant-контекста в запросах платформы показана на [рисунке 3.5](#fig-3-5).",
        "table-3-4": "Матрица разрешений по действиям и ролям приведена в [таблице 3.4](#table-3-4).",
        "table-3-5": "Конфигурация стенда и параметры тестирования представлены в [таблице 3.5](#table-3-5).",
        "table-3-6": "Результаты проверки ключевых сценариев приведены в [таблице 3.6](#table-3-6).",
        "table-3-8": "Ожидаемые эффекты внедрения платформы систематизированы в [таблице 3.8](#table-3-8).",
        "table-3-9": "Основные риски внедрения и эксплуатации приведены в [таблице 3.9](#table-3-9).",
        "fig-3-6": "Дорожная карта развития платформы представлена на [рисунке 3.6](#fig-3-6).",
        "table-3-10": "Соответствие экранов интерфейса функциональным требованиям приведено в [таблице 3.10](#table-3-10).",
        "table-3-11": "Сценарии демонстрации платформы систематизированы в [таблице 3.11](#table-3-11).",
        "fig-3-13": "Экранная карта SaaS-платформы представлена на [рисунке 3.13](#fig-3-13).",
        "table-3-13": "Легенда к экранной карте приведена в [таблице 3.13](#table-3-13).",
    }

    lines = content.split("\n")
    result: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        anchor_match = re.match(r'<a id="((?:table|fig)-\d+-\d+)"></a>', line.strip())
        if anchor_match:
            aid = anchor_match.group(1)
            # Check if reference already exists in previous 5 non-empty lines
            prev_text = "\n".join(result[-8:])
            if f"](#{aid})" not in prev_text and aid in intros:
                # Don't add if already anywhere in recent context
                if f"#{aid}" not in prev_text:
                    result.append("")
                    result.append(intros[aid])
                    result.append("")
            result.append(line)
            i += 1
            continue
        result.append(line)
        i += 1
    return "\n".join(result)


def process_file(path: Path) -> None:
    content = path.read_text(encoding="utf-8")
    content = move_figure_captions(content)
    content = add_table_anchors(content)
    content = add_figure_placeholder_anchors(content)
    content = add_missing_intro_refs(content)
    content = linkify_references(content)
    # Clean up triple blank lines
    content = re.sub(r"\n{4,}", "\n\n\n", content)
    path.write_text(content, encoding="utf-8")
    print(f"Processed {path}")


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    files = [
        root / "chapter-1.md",
        root / "chapter-2.md",
        root / "chapter-3.md",
    ]
    for f in files:
        if f.exists():
            process_file(f)
        else:
            print(f"Skip missing {f}", file=sys.stderr)


if __name__ == "__main__":
    main()
