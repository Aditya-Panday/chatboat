import { ChatWidget } from "@/components/ChatWidget";

export default async function WidgetPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = (await searchParams) || {};

  const toBool = (value: string | string[] | undefined, truthy = "1") =>
    String(value ?? "").toLowerCase() === truthy;

  const initialOpen = toBool(params.open);
  const hideLauncherWhenClosed = toBool(params.launcher, "0");

  return (
    <ChatWidget
      initialOpen={initialOpen}
      hideLauncherWhenClosed={hideLauncherWhenClosed}
    />
  );
}
