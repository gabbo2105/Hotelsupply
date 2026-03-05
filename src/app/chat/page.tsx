"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useChat } from "@/hooks/use-chat";
import { useCart } from "@/hooks/use-cart";

export default function ChatPage() {
  const chatHook = useChat();
  const { itemCount } = useCart();

  return (
    <DashboardLayout
      sidebar={<CartSidebar />}
      cartCount={itemCount}
      onNewChat={chatHook.newChat}
    >
      <ChatPanel chatHook={chatHook} />
    </DashboardLayout>
  );
}
