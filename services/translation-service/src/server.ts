import cors from "cors";
import express from "express";
import {
  allergenTaxonomy,
  ingredientTaxonomy,
  menuSectionTaxonomy,
  modifierTaxonomy,
  pickCatalogTranslation,
  scanMenuLanguages,
  uiTranslations
} from "@scanmenu/shared";
import type { LanguageCode, LocalizedPublicPageContent, PublicPageContent } from "@scanmenu/shared";
import { pickLocalizedText, supportedLanguages } from "@scanmenu/shared";

const phrasebook: Record<string, Partial<Record<LanguageCode, string>>> = {
  "no_onions": {
    ar: "بدون بصل",
    en: "no onions",
    ru: "без лука",
    tr: "soğansız",
    fr: "sans oignons",
    es: "sin cebolla",
    de: "ohne Zwiebeln",
    it: "senza cipolla",
    pt: "sem cebola",
    zh: "不加洋葱",
    ja: "玉ねぎなし",
    ko: "양파 없음",
    hi: "बिना प्याज",
    ur: "بغیر پیاز",
    fa: "بدون پیاز",
    he: "ללא בצל",
    id: "tanpa bawang",
    ms: "tanpa bawang",
    uk: "без цибулі",
    pl: "bez cebuli",
    nl: "zonder ui",
    sv: "utan lök",
    el: "χωρίς κρεμμύδι",
    vi: "không hành",
    th: "ไม่ใส่หัวหอม"
  },
  spicy: {
    ar: "حار",
    en: "spicy",
    ru: "острое",
    tr: "acı",
    fr: "épicé",
    es: "picante",
    de: "scharf",
    it: "piccante",
    pt: "picante",
    zh: "辣",
    ja: "辛い",
    ko: "매운",
    hi: "मसालेदार",
    ur: "مسالے دار",
    fa: "تند",
    he: "חריף",
    id: "pedas",
    ms: "pedas",
    uk: "гостре",
    pl: "ostre",
    nl: "pittig",
    sv: "stark",
    el: "πικάντικο",
    vi: "cay",
    th: "เผ็ด"
  },
  onion: {
    ar: "بصل",
    en: "onion",
    ru: "лук",
    tr: "soğan",
    fr: "oignon"
  },
  tomato: {
    ar: "طماطم",
    en: "tomato",
    ru: "помидор",
    tr: "domates",
    fr: "tomate"
  },
  "garlic sauce": {
    ar: "صلصة الثوم",
    en: "garlic sauce",
    ru: "чесночный соус",
    tr: "sarımsak sosu",
    fr: "sauce a l'ail"
  },
  lemon: {
    ar: "ليمون",
    en: "lemon",
    ru: "лимон",
    tr: "limon",
    fr: "citron"
  },
  "waiter request": {
    ar: "طلب نادل",
    en: "waiter request",
    ru: "вызов официанта",
    tr: "garson çağrısı",
    fr: "appel serveur"
  },
  "without": {
    ar: "بدون",
    en: "without",
    ru: "без",
    tr: "olmadan",
    fr: "sans"
  }
};

let publicPageContent: PublicPageContent = {
  id: "public-home",
  brandName: {
    ar: "Scan Menu",
    en: "Scan Menu",
    ru: "Scan Menu"
  },
  nav: {
    home: {
      ar: "الرئيسية",
      en: "Home",
      ru: "Главная",
      tr: "Ana sayfa",
      fr: "Accueil",
      es: "Inicio",
      de: "Start",
      zh: "首页"
    },
    pricing: {
      ar: "الأسعار",
      en: "Pricing",
      ru: "Цена",
      tr: "Fiyat",
      fr: "Tarifs",
      es: "Precios",
      de: "Preise",
      zh: "价格"
    },
    about: {
      ar: "من نحن",
      en: "About",
      ru: "О нас",
      tr: "Hakkımızda",
      fr: "À propos",
      es: "Nosotros",
      de: "Über uns",
      zh: "关于我们"
    },
    login: {
      ar: "دخول",
      en: "Login",
      ru: "Войти",
      tr: "Giriş",
      fr: "Connexion",
      es: "Iniciar sesión",
      de: "Anmelden",
      zh: "登录"
    },
    registration: {
      ar: "تسجيل",
      en: "Registration",
      ru: "Регистрация",
      tr: "Kayıt",
      fr: "Inscription",
      es: "Registro",
      de: "Registrierung",
      zh: "注册"
    },
    restaurant: {
      ar: "مطعمك",
      en: "Your Restaurant",
      ru: "Твой ресторан",
      tr: "Restoranın",
      fr: "Votre restaurant",
      es: "Tu restaurante",
      de: "Dein Restaurant",
      zh: "你的餐厅"
    }
  },
  hero: {
    eyebrow: {
      ar: "منصة مطاعم متعددة اللغات",
      en: "Multilingual restaurant platform",
      ru: "Многоязычная ресторанная платформа",
      tr: "Çok dilli restoran platformu",
      fr: "Plateforme de restauration multilingue",
      es: "Plataforma de restaurantes multilingüe",
      de: "Mehrsprachige Restaurantplattform",
      it: "Piattaforma di ristorazione multilingue",
      pt: "Plataforma de restaurantes multilíngue",
      zh: "多语言餐厅平台",
      ja: "多言語対応レストランプラットフォーム",
      ko: "다국어 레스토랑 플랫폼",
      hi: "बहुभाषी रेस्तरां प्लेटफ़ॉर्म",
      ur: "کثیر اللسانی ریستوران پلیٹ فارم",
      fa: "پلتفرم رستوران چندزبانه",
      he: "פלטפורמת מסעדות רב-לשונית",
      id: "Platform restoran multibahasa",
      ms: "Platform restoran pelbagai bahasa",
      uk: "Багатомовна ресторанна платформа",
      pl: "Wielojęzyczna platforma restauracyjna",
      nl: "Meertalige restaurantplatform",
      sv: "Flerspråkig restaurangplattform",
      el: "Πολύγλωσση πλατφόρμα εστιατορίων",
      vi: "Nền tảng nhà hàng đa ngôn ngữ",
      th: "แพลตฟอร์มร้านอาหารหลายภาษา"
    },
    title: {
      ar: "اجعل كل زائر يطلب بلغته، واجعل مطعمك يستقبل الطلب بلغته.",
      en: "Let every guest order in their language, while your restaurant receives it in yours.",
      ru: "Гость заказывает на своем языке, ресторан получает заказ на своем.",
      tr: "Her müşteri kendi dilinde sipariş versin, restoranınız ise siparişi kendi dilinde alsın.",
      fr: "Permettez à chaque client de commander dans sa langue, tandis que votre restaurant le reçoit dans la sienne.",
      es: "Permite que cada cliente ordene en su idioma, mientras tu restaurante lo recibe en el suyo.",
      de: "Lassen Sie jeden Gast in seiner Sprache bestellen, während Ihr Restaurant die Bestellung in seiner eigenen Sprache erhält.",
      it: "Consenti a ogni cliente di ordinare nella propria lingua, mentre il tuo ristorante riceve l'ordine nella sua.",
      pt: "Permita que cada cliente faça o pedido no seu idioma, enquanto o seu restaurante o recebe no seu.",
      zh: "让每位顾客用自己的语言点餐，而您的餐厅则用自己的语言接收订单。",
      ja: "すべてのゲストが自分の言語で注文し、レストランは自分の言語で受け取ります。",
      ko: "모든 고객이 자신의 언어로 주문하고, 레스토랑은 자신의 언어로 이를 받습니다.",
      hi: "हर ग्राहक अपनी भाषा में ऑर्डर करे, और आपका रेस्टोरेंट उसे अपनी भाषा में प्राप्त करे।",
      ur: "ہر گاہک اپنی زبان میں آرڈر کرے، اور آپ کا ریستوران اسے اپنی زبان میں وصول کرے۔",
      fa: "هر مشتری به زبان خودش سفارش دهد و رستوران شما آن را به زبان خودش دریافت کند.",
      he: "תנו לכל לקוח להזמין בשפתו, והמסעדה שלכם תקבל את ההזמנה בשפתה.",
      id: "Biarkan setiap pelanggan memesan dalam bahasanya, sementara restoran Anda menerimanya dalam bahasa Anda.",
      ms: "Biarkan setiap pelanggan membuat pesanan dalam bahasa mereka, sementara restoran anda menerimanya dalam bahasa anda.",
      uk: "Нехай кожен гість замовляє своєю мовою, а ваш ресторан отримує замовлення своєю.",
      pl: "Pozwól każdemu gościowi zamawiać w swoim języku, a Twoja restauracja otrzyma zamówienie w swoim.",
      nl: "Laat elke gast in zijn eigen taal bestellen, terwijl uw restaurant het in de uwe ontvangt.",
      sv: "Låt varje gäst beställa på sitt språk, medan din restaurang tar emot det på sitt.",
      el: "Αφήστε κάθε πελάτη να παραγγέλνει στη γλώσσα του, ενώ το εστιατόριό σας λαμβάνει την παραγγελία στη δική του.",
      vi: "Hãy để mỗi khách hàng đặt món bằng ngôn ngữ của họ, trong khi nhà hàng của bạn nhận đơn bằng ngôn ngữ của mình.",
      th: "ให้ลูกค้าทุกคนสั่งอาหารด้วยภาษาของตนเอง ในขณะที่ร้านอาหารของคุณรับคำสั่งซื้อด้วยภาษาของคุณ"
    },
    subtitle: {
      ar: "Scan Menu تربط العملاء والمطاعم عبر ترجمة مركزية، إدارة قوائم، طلبات مباشرة، وصلاحيات للموظفين والمحاسبين وأصحاب المطاعم.",
      en: "Scan Menu connects guests and restaurants with central translation, menu management, live orders, and roles for staff, accountants, and owners.",
      ru: "Scan Menu объединяет гостей и рестораны: переводы, меню, заказы и роли для сотрудников, бухгалтеров и владельцев.",
      tr: "Scan Menu, merkezi çeviri, menü yönetimi, canlı siparişler ve personel, muhasebeciler ve işletme sahipleri için roller ile müşterileri ve restoranları bir araya getirir.",
      fr: "Scan Menu relie les clients et les restaurants grâce à une traduction centralisée, la gestion des menus, des commandes en temps réel et des rôles pour le personnel, les comptables et les propriétaires.",
      es: "Scan Menu conecta a clientes y restaurantes con traducción centralizada, gestión de menús, pedidos en tiempo real y roles para el personal, contables y propietarios.",
      de: "Scan Menu verbindet Gäste und Restaurants mit zentraler Übersetzung, Menüverwaltung, Live-Bestellungen und Rollen für Personal, Buchhalter und Eigentümer.",
      it: "Scan Menu collega clienti e ristoranti con traduzione centralizzata, gestione del menu, ordini in tempo reale e ruoli per staff, contabili e proprietari.",
      pt: "Scan Menu conecta clientes e restaurantes com tradução centralizada, gestão de menus, pedidos em tempo real e funções para funcionários, contadores e proprietários.",
      zh: "Scan Menu 通过集中翻译、菜单管理、实时订单以及为员工、会计和餐厅老板设置角色，将顾客与餐厅连接起来。",
      ja: "Scan Menu は、中央翻訳、メニュー管理、リアルタイム注文、スタッフ・会計・オーナー向けの役割機能で、顧客とレストランをつなぎます。",
      ko: "Scan Menu는 중앙 번역, 메뉴 관리, 실시간 주문, 직원·회계·운영자를 위한 역할 기능을 통해 고객과 레스토랑을 연결합니다.",
      hi: "Scan Menu ग्राहकों और रेस्तरां को केंद्रीय अनुवाद, मेनू प्रबंधन, लाइव ऑर्डर और स्टाफ, अकाउंटेंट और मालिकों के लिए भूमिकाओं के साथ जोड़ता है।",
      ur: "Scan Menu مرکزی ترجمہ، مینو مینجمنٹ، لائیو آرڈرز اور عملے، اکاؤنٹنٹس اور مالکان کے لیے رولز کے ذریعے صارفین اور ریستورانز کو جوڑتا ہے۔",
      fa: "Scan Menu مشتریان و رستوران‌ها را با ترجمه متمرکز، مدیریت منو، سفارش‌های زنده و نقش‌هایی برای کارکنان، حسابداران و مالکان به هم متصل می‌کند.",
      he: "Scan Menu מחבר בין לקוחות למסעדות באמצעות תרגום מרכזי, ניהול תפריטים, הזמנות בזמן אמת ותפקידים לצוות, רואי חשבון ובעלים.",
      id: "Scan Menu menghubungkan pelanggan dan restoran dengan terjemahan terpusat, manajemen menu, pesanan real-time, serta peran untuk staf, akuntan, dan pemilik.",
      ms: "Scan Menu menghubungkan pelanggan dan restoran melalui terjemahan berpusat, pengurusan menu, pesanan masa nyata serta peranan untuk kakitangan, akauntan dan pemilik.",
      uk: "Scan Menu поєднує гостей і ресторани за допомогою централізованого перекладу, управління меню, онлайн-замовлень і ролей для персоналу, бухгалтерів та власників.",
      pl: "Scan Menu łączy klientów i restauracje dzięki centralnemu tłumaczeniu, zarządzaniu menu, zamówieniom na żywo oraz rolom dla personelu, księgowych i właścicieli.",
      nl: "Scan Menu verbindt klanten en restaurants met centrale vertaling, menubeheer, live bestellingen en rollen voor personeel, boekhouders en eigenaren.",
      sv: "Scan Menu kopplar samman gäster och restauranger med central översättning, menyhantering, livebeställningar och roller för personal, ekonomer och ägare.",
      el: "Το Scan Menu συνδέει πελάτες και εστιατόρια με κεντρική μετάφραση, διαχείριση μενού, ζωντανές παραγγελίες και ρόλους για προσωπικό, λογιστές και ιδιοκτήτες.",
      vi: "Scan Menu kết nối khách hàng và nhà hàng thông qua dịch thuật tập trung, quản lý menu, đơn hàng thời gian thực và các vai trò cho nhân viên, kế toán và chủ sở hữu.",
      th: "Scan Menu เชื่อมต่อลูกค้าและร้านอาหารด้วยการแปลแบบศูนย์กลาง การจัดการเมนู คำสั่งซื้อแบบเรียลไทม์ และบทบาทสำหรับพนักงาน นักบัญชี และเจ้าของร้าน"
    },
    primaryAction: {
      ar: "ابدأ لمطعمك",
      en: "Start your restaurant",
      ru: "Начать для ресторана",
      tr: "Restoranınız için başlayın",
      fr: "Démarrer pour votre restaurant",
      es: "Empieza para tu restaurante",
      de: "Für Ihr Restaurant starten",
      it: "Avvia per il tuo ristorante",
      pt: "Comece para o seu restaurante",
      zh: "为您的餐厅开始",
      ja: "あなたのレストランを始める",
      ko: "레스토랑 시작하기",
      hi: "अपने रेस्तरां के लिए शुरू करें",
      ur: "اپنے ریستوران کے لیے شروع کریں",
      fa: "برای رستوران خود شروع کنید",
      he: "התחל עבור המסעדה שלך",
      id: "Mulai untuk restoran Anda",
      ms: "Mulakan untuk restoran anda",
      uk: "Почати для вашого ресторану",
      pl: "Rozpocznij dla swojej restauracji",
      nl: "Begin voor uw restaurant",
      sv: "Starta för din restaurang",
      el: "Ξεκινήστε για το εστιατόριό σας",
      vi: "Bắt đầu cho nhà hàng của bạn",
      th: "เริ่มต้นสำหรับร้านอาหารของคุณ"
    },
    secondaryAction: {
      ar: "شاهد المزايا",
      en: "Explore features",
      ru: "Посмотреть функции",
      tr: "Özellikleri keşfet",
      fr: "Explorer les fonctionnalités",
      es: "Explorar funciones",
      de: "Funktionen entdecken",
      it: "Esplora le funzionalità",
      pt: "Explorar recursos",
      zh: "查看功能",
      ja: "機能を見る",
      ko: "기능 살펴보기",
      hi: "सुविधाएँ देखें",
      ur: "خصوصیات دیکھیں",
      fa: "مشاهده ویژگی‌ها",
      he: "גלה תכונות",
      id: "Jelajahi fitur",
      ms: "Terokai ciri",
      uk: "Переглянути функції",
      pl: "Zobacz funkcje",
      nl: "Bekijk functies",
      sv: "Utforska funktioner",
      el: "Εξερευνήστε λειτουργίες",
      vi: "Khám phá tính năng",
      th: "สำรวจฟีเจอร์"
    },
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
  },
  featureCards: [
    {
      id: "translation",
      title: {
        ar: "ترجمة الطلبات",
        en: "Order translation",
        ru: "Перевод заказов"
      },
      description: {
        ar: "العميل يكتب ملاحظته بلغته، والمطبخ يستلمها بلغة المطعم.",
        en: "Guests write notes in their language; the kitchen receives them in the restaurant language.",
        ru: "Гость пишет комментарий на своем языке, кухня получает его на языке ресторана.",
        tr: "Müşteriler notlarını kendi dillerinde yazar; mutfak bunları restoranın dilinde alır.",
        fr: "Les clients écrivent leurs notes dans leur langue ; la cuisine les reçoit dans la langue du restaurant.",
        es: "Los clientes escriben notas en su idioma; la cocina las recibe en el idioma del restaurante.",
        de: "Gäste schreiben Notizen in ihrer Sprache; die Küche erhält sie in der Sprache des Restaurants.",
        it: "I clienti scrivono note nella loro lingua; la cucina le riceve nella lingua del ristorante.",
        pt: "Os clientes escrevem notas em seu idioma; a cozinha as recebe no idioma do restaurante.",
        zh: "顾客用自己的语言写备注；厨房以餐厅的语言接收。",
        ja: "ゲストは自分の言語でメモを書き、キッチンはレストランの言語で受け取ります。",
        ko: "고객은 자신의 언어로 메모를 작성하고, 주방은 이를 레스토랑 언어로 받습니다.",
        hi: "ग्राहक अपनी भाषा में नोट लिखते हैं; रसोई उन्हें रेस्तरां की भाषा में प्राप्त करती है।",
        ur: "گاہک اپنی زبان میں نوٹ لکھتے ہیں؛ کچن انہیں ریستوران کی زبان میں وصول کرتا ہے۔",
        fa: "مشتریان یادداشت‌های خود را به زبان خود می‌نویسند؛ آشپزخانه آن‌ها را به زبان رستوران دریافت می‌کند.",
        he: "לקוחות כותבים הערות בשפתם; המטבח מקבל אותן בשפת המסעדה.",
        id: "Pelanggan menulis catatan dalam bahasa mereka; dapur menerimanya dalam bahasa restoran.",
        ms: "Pelanggan menulis nota dalam bahasa mereka; dapur menerimanya dalam bahasa restoran.",
        uk: "Гості пишуть нотатки своєю мовою; кухня отримує їх мовою ресторану.",
        pl: "Goście piszą notatki w swoim języku; kuchnia otrzymuje je w języku restauracji.",
        nl: "Gasten schrijven notities in hun taal; de keuken ontvangt ze in de taal van het restaurant.",
        sv: "Gäster skriver anteckningar på sitt språk; köket får dem på restaurangens språk.",
        el: "Οι πελάτες γράφουν σημειώσεις στη γλώσσα τους· η κουζίνα τις λαμβάνει στη γλώσσα του εστιατορίου.",
        vi: "Khách hàng viết ghi chú bằng ngôn ngữ của họ; nhà bếp nhận được bằng ngôn ngữ của nhà hàng.",
        th: "ลูกค้าเขียนโน้ตด้วยภาษาของตนเอง และครัวจะได้รับในภาษาของร้านอาหาร"
      },
      imageUrl:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "operations",
      title: {
        ar: "تشغيل المطعم",
        en: "Restaurant operations",
        ru: "Управление рестораном"
      },
      description: {
        ar: "إدارة القوائم، الموظفين، الكاشير، المطبخ، الفروع، وخدمات التوصيل.",
        en: "Manage menus, staff, cashier, kitchen, branches, and delivery services.",
        ru: "Меню, сотрудники, касса, кухня, филиалы и службы доставки в одном месте.",
        tr: "Menüleri, personeli, kasiyeri, mutfağı, şubeleri ve teslimat hizmetlerini yönetin.",
        fr: "Gérez les menus, le personnel, la caisse, la cuisine, les succursales et les services de livraison.",
        es: "Gestiona menús, personal, caja, cocina, sucursales y servicios de entrega.",
        de: "Verwalten Sie Menüs, Personal, Kasse, Küche, Filialen und Lieferdienste.",
        it: "Gestisci menu, personale, cassa, cucina, filiali e servizi di consegna.",
        pt: "Gerencie menus, equipe, caixa, cozinha, filiais e serviços de entrega.",
        zh: "管理菜单、员工、收银、厨房、分店和配送服务。",
        ja: "メニュー、スタッフ、レジ、キッチン、支店、配送サービスを管理します。",
        ko: "메뉴, 직원, 계산대, 주방, 지점 및 배송 서비스를 관리하세요.",
        hi: "मेनू, स्टाफ, कैशियर, किचन, शाखाएँ और डिलीवरी सेवाओं का प्रबंधन करें।",
        ur: "مینو، عملہ، کیشیئر، کچن، برانچز اور ڈیلیوری سروسز کا انتظام کریں۔",
        fa: "مدیریت منو، کارکنان، صندوق‌دار، آشپزخانه، شعب و خدمات تحویل.",
        he: "נהל תפריטים, צוות, קופה, מטבח, סניפים ושירותי משלוחים.",
        id: "Kelola menu, staf, kasir, dapur, cabang, dan layanan pengiriman.",
        ms: "Urus menu, kakitangan, juruwang, dapur, cawangan dan perkhidmatan penghantaran.",
        uk: "Керуйте меню, персоналом, касою, кухнею, філіями та службами доставки.",
        pl: "Zarządzaj menu, personelem, kasą, kuchnią, oddziałami i usługami dostawy.",
        nl: "Beheer menu's, personeel, kassa, keuken, vestigingen en bezorgdiensten.",
        sv: "Hantera menyer, personal, kassa, kök, filialer och leveranstjänster.",
        el: "Διαχειριστείτε μενού, προσωπικό, ταμείο, κουζίνα, υποκαταστήματα και υπηρεσίες παράδοσης.",
        vi: "Quản lý menu, nhân viên, thu ngân, bếp, chi nhánh và dịch vụ giao hàng.",
        th: "จัดการเมนู พนักงาน แคชเชียร์ ครัว สาขา และบริการจัดส่ง"
      },
      imageUrl:
        "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "analytics",
      title: {
        ar: "محاسبة ورقابة",
        en: "Accounting and control",
        ru: "Финансы и контроль"
      },
      description: {
        ar: "صلاحيات للمحاسبين وتقارير تساعد مالك المطعم ومالك المنصة.",
        en: "Accountant roles and reports for restaurant owners and platform ownership.",
        ru: "Роли бухгалтеров и отчеты для владельцев ресторанов и платформы."
      },
      imageUrl:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
    }
  ],
  pricing: [
    {
      id: "basic",
      name: { ar: "Basic", en: "Basic", ru: "Basic" },
      price: { ar: "0 / شهر", en: "0 / mo", ru: "0 / мес" },
      features: [
        { ar: "10 أصناف في القائمة", en: "10 menu items", ru: "10 позиций меню" },
        { ar: "إدارة 5 موظفين", en: "Manage 5 employees", ru: "5 сотрудников" }
      ]
    },
    {
      id: "standard",
      name: { ar: "Standard", en: "Standard", ru: "Standard" },
      price: { ar: "19.99$ / شهر", en: "$19.99 / mo", ru: "19.99$ / мес" },
      features: [
        { ar: "25 صنفًا في القائمة", en: "25 menu items", ru: "25 позиций меню" },
        { ar: "إدارة 15 موظفًا", en: "Manage 15 employees", ru: "15 сотрудников" }
      ]
    },
    {
      id: "premium",
      name: { ar: "Premium", en: "Premium", ru: "Premium" },
      price: { ar: "29.99$ / شهر", en: "$29.99 / mo", ru: "29.99$ / мес" },
      features: [
        { ar: "موظفون وقوائم غير محدودة", en: "Unlimited staff and menu items", ru: "Безлимитные сотрудники и меню" },
        { ar: "تقارير ومراقبة", en: "Reports and monitoring", ru: "Отчеты и мониторинг" }
      ]
    }
  ],
  about: {
    title: {
      ar: "Scan Menu ليست صفحة تعريف فقط، بل نظام تشغيل للمطاعم.",
      en: "Scan Menu is not only a website. It is an operating system for restaurants.",
      ru: "Scan Menu - не просто сайт, а операционная система для ресторанов."
    },
    body: {
      ar: "يمكن لمالك المنصة التحكم بمحتوى الصفحة العامة، اللغات، الأسعار، وواجهات المطاعم من لوحة التحكم.",
      en: "The platform owner can control public content, languages, pricing, and restaurant-facing areas from the dashboard.",
      ru: "Владелец платформы управляет контентом, языками, тарифами и ресторанными разделами из панели."
    }
  },
  restaurantPortal: {
    title: {
      ar: "منطقة مطعمك",
      en: "Your restaurant area",
      ru: "Зона ресторана"
    },
    menuItems: [
      {
        ar: "الملف الشخصي",
        en: "Profile",
        ru: "Профиль",
        tr: "Profil",
        fr: "Profil",
        es: "Perfil",
        de: "Profil",
        it: "Profilo",
        pt: "Perfil",
        zh: "个人资料",
        ja: "プロフィール",
        ko: "프로필",
        hi: "प्रोफ़ाइल",
        ur: "پروفائل",
        fa: "پروفایل",
        he: "פרופיל",
        id: "Profil",
        ms: "Profil",
        uk: "Профіль",
        pl: "Profil",
        nl: "Profiel",
        sv: "Profil",
        el: "Προφίλ",
        vi: "Hồ sơ",
        th: "โปรไฟล์"
      },
      {
        ar: "تغيير الخطة",
        en: "Change plan",
        ru: "Изменить план",
        tr: "Planı değiştir",
        fr: "Changer le plan",
        es: "Cambiar plan",
        de: "Plan ändern",
        it: "Cambia piano",
        pt: "Alterar plano",
        zh: "更改套餐",
        ja: "プランを変更",
        ko: "요금제 변경",
        hi: "योजना बदलें",
        ur: "پلان تبدیل کریں",
        fa: "تغییر طرح",
        he: "שנה תוכנית",
        id: "Ubah paket",
        ms: "Tukar pelan",
        uk: "Змінити план",
        pl: "Zmień plan",
        nl: "Plan wijzigen",
        sv: "Ändra plan",
        el: "Αλλαγή προγράμματος",
        vi: "Thay đổi gói",
        th: "เปลี่ยนแผน"
      },
      {
        ar: "القائمة",
        en: "Menu",
        ru: "Меню",
        tr: "Menü",
        fr: "Menu",
        es: "Menú",
        de: "Menü",
        it: "Menu",
        pt: "Menu",
        zh: "菜单",
        ja: "メニュー",
        ko: "메뉴",
        hi: "मेनू",
        ur: "مینو",
        fa: "منو",
        he: "תפריט",
        id: "Menu",
        ms: "Menu",
        uk: "Меню",
        pl: "Menu",
        nl: "Menu",
        sv: "Meny",
        el: "Μενού",
        vi: "Thực đơn",
        th: "เมนู"
      },
      {
        ar: "الموظفون",
        en: "Employees",
        ru: "Сотрудники",
        tr: "Çalışanlar",
        fr: "Employés",
        es: "Empleados",
        de: "Mitarbeiter",
        it: "Dipendenti",
        pt: "Funcionários",
        zh: "员工",
        ja: "従業員",
        ko: "직원",
        hi: "कर्मचारी",
        ur: "ملازمین",
        fa: "کارمندان",
        he: "עובדים",
        id: "Karyawan",
        ms: "Pekerja",
        uk: "Співробітники",
        pl: "Pracownicy",
        nl: "Medewerkers",
        sv: "Anställda",
        el: "Υπάλληλοι",
        vi: "Nhân viên",
        th: "พนักงาน"
      },
      {
        ar: "المطبخ",
        en: "Kitchen",
        ru: "Кухня",
        tr: "Mutfak",
        fr: "Cuisine",
        es: "Cocina",
        de: "Küche",
        it: "Cucina",
        pt: "Cozinha",
        zh: "厨房",
        ja: "キッチン",
        ko: "주방",
        hi: "रसोई",
        ur: "باورچی خانہ",
        fa: "آشپزخانه",
        he: "מטבח",
        id: "Dapur",
        ms: "Dapur",
        uk: "Кухня",
        pl: "Kuchnia",
        nl: "Keuken",
        sv: "Kök",
        el: "Κουζίνα",
        vi: "Bếp",
        th: "ครัว"
      },
      {
        ar: "الكاشير",
        en: "Cashier",
        ru: "Кассир",
        tr: "Kasiyer",
        fr: "Caissier",
        es: "Cajero",
        de: "Kassierer",
        it: "Cassiere",
        pt: "Caixa",
        zh: "收银员",
        ja: "レジ係",
        ko: "계산원",
        hi: "कैशियर",
        ur: "کیشئر",
        fa: "صندوقدار",
        he: "קופאי",
        id: "Kasir",
        ms: "Juruwang",
        uk: "Касир",
        pl: "Kasjer",
        nl: "Kassier",
        sv: "Kassör",
        el: "Ταμίας",
        vi: "Thu ngân",
        th: "แคชเชียร์"
      },
      {
        ar: "اللغات",
        en: "Languages",
        ru: "Языки",
        tr: "Diller",
        fr: "Langues",
        es: "Idiomas",
        de: "Sprachen",
        it: "Lingue",
        pt: "Idiomas",
        zh: "语言",
        ja: "言語",
        ko: "언어",
        hi: "भाषाएँ",
        ur: "زبانیں",
        fa: "زبان‌ها",
        he: "שפות",
        id: "Bahasa",
        ms: "Bahasa",
        uk: "Мови",
        pl: "Języki",
        nl: "Talen",
        sv: "Språk",
        el: "Γλώσσες",
        vi: "Ngôn ngữ",
        th: "ภาษา"
      },
      {
        ar: "المالية",
        en: "Finance",
        ru: "Финансы",
        tr: "Finans",
        fr: "Finance",
        es: "Finanzas",
        de: "Finanzen",
        it: "Finanza",
        pt: "Finanças",
        zh: "财务",
        ja: "財務",
        ko: "재무",
        hi: "वित्त",
        ur: "مالیات",
        fa: "مالی",
        he: "כספים",
        id: "Keuangan",
        ms: "Kewangan",
        uk: "Фінанси",
        pl: "Finanse",
        nl: "Financiën",
        sv: "Ekonomi",
        el: "Οικονομικά",
        vi: "Tài chính",
        th: "การเงิน"
      }
    ]
  },
  updatedAt: new Date().toISOString()
};

const port = Number(process.env.TRANSLATION_SERVICE_PORT ?? 4104);

export function createApp() {
  const app = express();

app.use(cors());
app.use(express.json());

app.get("/languages", (_req, res) => {
  res.json({ data: scanMenuLanguages });
});

app.get("/translations", (_req, res) => {
  res.json({ data: Object.fromEntries(uiTranslations.map((item) => [item.key, item.translations])) });
});

app.get("/translations/:language", (req, res) => {
  const language = String(req.params.language);
  res.json({ data: Object.fromEntries(uiTranslations.map((item) => [item.key, pickCatalogTranslation(item.translations, language)])) });
});

app.get("/ingredients", (_req, res) => {
  res.json({ data: ingredientTaxonomy });
});

app.get("/sections", (_req, res) => {
  res.json({ data: menuSectionTaxonomy });
});

app.get("/sections/:language", (req, res) => {
  const language = String(req.params.language);
  res.json({
    data: menuSectionTaxonomy.map((item) => ({
      id: item.id,
      displayName: pickCatalogTranslation(item.translations, language),
      translations: item.translations
    }))
  });
});

app.get("/ingredients/:language", (req, res) => {
  const language = String(req.params.language);
  res.json({
    data: ingredientTaxonomy.map((item) => ({
      id: item.id,
      category: item.category,
      allergens: item.allergens,
      displayName: pickCatalogTranslation(item.translations, language),
      translations: item.translations
    }))
  });
});

app.get("/modifiers", (_req, res) => {
  res.json({ data: modifierTaxonomy });
});

app.get("/modifiers/:language", (req, res) => {
  const language = String(req.params.language);
  res.json({
    data: modifierTaxonomy.map((item) => ({
      id: item.id,
      type: item.type,
      ingredientId: item.ingredientId,
      displayName: pickCatalogTranslation(item.translations, language),
      translations: item.translations
    }))
  });
});

app.get("/allergens", (_req, res) => {
  res.json({ data: allergenTaxonomy });
});

app.get("/allergens/:language", (req, res) => {
  const language = String(req.params.language);
  res.json({
    data: allergenTaxonomy.map((item) => ({
      id: item.id,
      displayName: pickCatalogTranslation(item.translations, language),
      translations: item.translations
    }))
  });
});

  app.get("/health", (_req, res) => {
    res.json({ data: { service: "translation-service", status: "ok" } });
  });

  app.get("/languages", (_req, res) => {
    res.json({ data: supportedLanguages });
  });

  app.get("/public-page/raw", (_req, res) => {
    res.json({ data: publicPageContent });
  });

  app.get("/public-page", (req, res) => {
    const language = String(req.query.language ?? "en");
    res.json({ data: localizePublicPage(language) });
  });

  app.put("/public-page", (req, res) => {
    publicPageContent = {
      ...publicPageContent,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ data: publicPageContent });
  });

  app.post("/translate", (req, res) => {
    const sourceText = String(req.body.text ?? "");
    const text = sourceText.trim().toLowerCase();
    const targetLanguage = (req.body.targetLanguage ?? "en") as LanguageCode;
    const phraseKey = text.trim().toLowerCase().replace(/\s+/g, "_");
    const phrase = phrasebook[text] ?? phrasebook[phraseKey];
    const translatedText = phrase?.[targetLanguage] ?? sourceText;

    res.json({
      data: {
        sourceText,
        sourceLanguage: req.body.sourceLanguage ?? "auto",
        targetLanguage,
        translatedText,
        provider: phrase ? "scanmenu-phrasebook" : "source-fallback"
      }
    });
  });

  return app;
}

export function localizePublicPage(language: string): LocalizedPublicPageContent {
  const direction =
    supportedLanguages.find((item) => item.code === language)?.direction ??
    (["ar", "fa", "he", "ur"].includes(language) ? "rtl" : "ltr");

  return {
    id: publicPageContent.id,
    brandName: pickLocalizedText(publicPageContent.brandName, language),
    nav: {
      home: pickLocalizedText(publicPageContent.nav.home, language),
      pricing: pickLocalizedText(publicPageContent.nav.pricing, language),
      about: pickLocalizedText(publicPageContent.nav.about, language),
      login: pickLocalizedText(publicPageContent.nav.login, language),
      registration: pickLocalizedText(publicPageContent.nav.registration, language),
      restaurant: pickLocalizedText(publicPageContent.nav.restaurant, language)
    },
    hero: {
      eyebrow: pickLocalizedText(publicPageContent.hero.eyebrow, language),
      title: pickLocalizedText(publicPageContent.hero.title, language),
      subtitle: pickLocalizedText(publicPageContent.hero.subtitle, language),
      primaryAction: pickLocalizedText(publicPageContent.hero.primaryAction, language),
      secondaryAction: pickLocalizedText(publicPageContent.hero.secondaryAction, language),
      imageUrl: publicPageContent.hero.imageUrl
    },
    featureCards: publicPageContent.featureCards.map((card) => ({
      id: card.id,
      title: pickLocalizedText(card.title, language),
      description: pickLocalizedText(card.description, language),
      imageUrl: card.imageUrl
    })),
    pricing: publicPageContent.pricing.map((plan) => ({
      id: plan.id,
      name: pickLocalizedText(plan.name, language),
      price: pickLocalizedText(plan.price, language),
      features: plan.features.map((feature) => pickLocalizedText(feature, language))
    })),
    about: {
      title: pickLocalizedText(publicPageContent.about.title, language),
      body: pickLocalizedText(publicPageContent.about.body, language)
    },
    restaurantPortal: {
      title: pickLocalizedText(publicPageContent.restaurantPortal.title, language),
      menuItems: publicPageContent.restaurantPortal.menuItems.map((item) =>
        pickLocalizedText(item, language)
      )
    },
    language,
    direction,
    updatedAt: publicPageContent.updatedAt
  };
}

const app = createApp();

if (!process.env.SCANMENU_SKIP_LISTEN) {
  app.listen(port, () => {
    console.log(`Translation service listening on http://localhost:${port}`);
  });
}
