"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/lib/types";

const PAGE_SIZE = 30;

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, count } = await query;
    setOrders((data as Order[]) ?? []);
    setTotalCount(count ?? 0);
    setIsLoading(false);
  }, [statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
        );
      }
      return error ? error.message : null;
    },
    [],
  );

  return {
    orders,
    isLoading,
    statusFilter,
    setStatusFilter: (s: OrderStatus | "all") => {
      setStatusFilter(s);
      setPage(1);
    },
    page,
    setPage,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    totalCount,
    updateStatus,
    refetch: fetchOrders,
  };
}
