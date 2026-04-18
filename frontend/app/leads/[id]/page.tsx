"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?lead=${id}`);
  }, [id, router]);

  return null;
}
