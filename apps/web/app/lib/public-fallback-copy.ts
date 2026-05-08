const publicFallbackCopy: Record<
  string,
  { customerOrder: string; plansTitle: string }
> = {
  ar: { customerOrder: "طلب الزبون", plansTitle: "خطط بابلي" },
  en: { customerOrder: "Customer order", plansTitle: "Babili plans" },
  ru: { customerOrder: "Заказ клиента", plansTitle: "Тарифы Бабили" },
  tr: { customerOrder: "Müşteri siparişi", plansTitle: "Babili planları" },
  fr: { customerOrder: "Commande client", plansTitle: "Offres Babili" },
  es: { customerOrder: "Pedido del cliente", plansTitle: "Planes Babili" },
  de: { customerOrder: "Kundenbestellung", plansTitle: "Babili Tarife" },
};

export function getPublicFallbackCopy(language: string) {
  return publicFallbackCopy[language] ?? publicFallbackCopy.en!;
}
