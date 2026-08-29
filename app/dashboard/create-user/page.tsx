import { redirect } from "next/navigation";

export default function CreateUserRedirectPage() {
  redirect("/dashboard/create-customer");
}
