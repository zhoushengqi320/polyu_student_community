export async function listUsers(_filters: unknown = {}) {
  return [];
}

export async function banUser(_userId: string, _reason?: string) {
    throw new Error("功能尚未开放，请先配置数据库");
}

export async function unbanUser(_userId: string) {
    throw new Error("功能尚未开放，请先配置数据库");
}

export async function verifyPolyuUser(_userId: string) {
    throw new Error("功能尚未开放，请先配置数据库");
}

export async function hideContent(
  _targetType: string,
  _targetId: string,
) {
    throw new Error("功能尚未开放，请先配置数据库");
}
