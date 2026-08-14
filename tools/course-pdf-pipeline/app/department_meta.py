"""与网站 import 脚本 DEPARTMENT_META 保持一致，便于导出后直接入库。"""

DEPARTMENT_META: dict[str, dict[str, str | None]] = {
    "AAE": {"department": "aae", "faculty": "Faculty of Engineering"},
    "ABCT": {"department": "abct", "faculty": "Faculty of Science"},
    "ABCT2": {"department": "abct", "faculty": "Faculty of Science"},
    "AF": {"department": "af", "faculty": "Faculty of Business"},
    "AMA": {"department": "ama", "faculty": "Faculty of Science"},
    "APSS": {
        "department": "apss",
        "faculty": "Faculty of Health and Social Sciences",
    },
    "AP_M": {"department": "ap", "faculty": "Faculty of Science"},
    "AP_RP": {"department": "ap", "faculty": "Faculty of Science"},
    "AP_UG": {"department": "ap", "faculty": "Faculty of Science"},
    "BME": {"department": "bme", "faculty": "Faculty of Engineering"},
    "CEE": {
        "department": "cee",
        "faculty": "Faculty of Construction and Environment",
    },
    "CHC_M": {"department": "chc", "faculty": "Faculty of Humanities"},
    "CHC_UG": {"department": "chc", "faculty": "Faculty of Humanities"},
    "CLC": {"department": "clc", "faculty": "Faculty of Humanities"},
    "COMP": {"department": "comp", "faculty": "Faculty of Engineering"},
    "COMP2": {"department": "comp", "faculty": "Faculty of Engineering"},
    "DSAI": {"department": "dsai", "faculty": "Faculty of Engineering"},
    "EEE": {"department": "eee", "faculty": "Faculty of Engineering"},
    "ENGL": {"department": "engl", "faculty": "Faculty of Humanities"},
    "FB": {"department": "fb", "faculty": "Faculty of Business"},
    "FSN": {"department": "fsn", "faculty": "Faculty of Science"},
    "LMS": {"department": "lms", "faculty": "Faculty of Business"},
    "LSGI": {
        "department": "lsgi",
        "faculty": "Faculty of Construction and Environment",
    },
    "ME": {"department": "me", "faculty": "Faculty of Engineering"},
    "MM": {"department": "mm", "faculty": "Faculty of Business"},
    "SFT": {"department": "sft", "faculty": "School of Fashion and Textiles"},
    "SHTM": {
        "department": "shtm",
        "faculty": "School of Hotel and Tourism Management",
    },
}


def guess_department_from_code(code: str) -> dict[str, str | None]:
    compact = (code or "").split(":")[0].upper().strip()
    for prefix_len in (6, 5, 4, 3, 2):
        prefix = compact[:prefix_len]
        if prefix in DEPARTMENT_META:
            return dict(DEPARTMENT_META[prefix])
    # 字母前缀兜底
    letters = "".join(ch for ch in compact if ch.isalpha())[:6]
    for prefix_len in range(min(6, len(letters)), 1, -1):
        prefix = letters[:prefix_len]
        if prefix in DEPARTMENT_META:
            return dict(DEPARTMENT_META[prefix])
    return {
        "department": letters.lower() if letters else "unknown",
        "faculty": None,
    }


def guess_from_folder(folder_name: str | None) -> dict[str, str | None]:
    if not folder_name:
        return {"department": "unknown", "faculty": None}
    key = folder_name.strip().upper()
    if key in DEPARTMENT_META:
        return dict(DEPARTMENT_META[key])
    return {"department": key.lower(), "faculty": None}
