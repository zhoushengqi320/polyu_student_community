/** 私信页高度 = 视口减去顶栏，聊天框底部对齐正文与页脚交界 */
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] flex-col overflow-hidden overscroll-contain">
      {children}
    </div>
  );
}
