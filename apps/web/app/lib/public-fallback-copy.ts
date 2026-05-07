const publicFallbackCopy: Record<
  string,
  { customerOrder: string; plansTitle: string }
> = {
  ar: { customerOrder: "طلب الزبون", plansTitle: "خطط Scan Menu" },
  en: { customerOrder: "Customer order", plansTitle: "Scan Menu plans" },
  ru: { customerOrder: "Заказ клиента", plansTitle: "Тарифы Scan Menu" },
  tr: { customerOrder: "Müşteri siparişi", plansTitle: "Scan Menu planları" },
  fr: { customerOrder: "Commande client", plansTitle: "Offres Scan Menu" },
  es: { customerOrder: "Pedido del cliente", plansTitle: "Planes Scan Menu" },
  de: { customerOrder: "Kundenbestellung", plansTitle: "Scan Menu Tarife" },
};

export function getPublicFallbackCopy(language: string) {
  return publicFallbackCopy[language] ?? publicFallbackCopy.en!;
}
