import { Suspense } from "react";
import JoinClient from "@/components/JoinClient";

async function Inner({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JoinClient code={code} />;
}

export default function Page({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={null}>
      <Inner params={params} />
    </Suspense>
  );
}
