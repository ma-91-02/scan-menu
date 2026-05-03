"use client";

import { useState } from "react";
import type { PublicPageContent } from "@scanmenu/shared";
import { apiUrl } from "../../lib/api";

interface PublicContentManagerProps {
  initialContent: PublicPageContent;
}

export function PublicContentManager({ initialContent }: PublicContentManagerProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function saveContent() {
    setStatus("saving");

    try {
      const response = await fetch(`${apiUrl}/translations/public-page`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <article className="card content-manager-card">
      <div className="topbar compact">
        <div>
          <h2>إدارة محتوى الواجهة العامة</h2>
          <p className="muted">هذه الحقول تتحكم بالنصوص الرئيسية في الصفحة العامة حسب اللغة.</p>
        </div>
        <button className="button" type="button" onClick={saveContent} disabled={status === "saving"}>
          {status === "saving" ? "جاري الحفظ" : "حفظ المحتوى"}
        </button>
      </div>

      <div className="editor-grid">
        <label className="field">
          <span>عنوان الصفحة بالعربية</span>
          <textarea
            value={content.hero.title.ar ?? ""}
            onChange={(event) =>
              setContent((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  title: { ...current.hero.title, ar: event.target.value }
                }
              }))
            }
          />
        </label>

        <label className="field">
          <span>Hero title English</span>
          <textarea
            value={content.hero.title.en ?? ""}
            onChange={(event) =>
              setContent((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  title: { ...current.hero.title, en: event.target.value }
                }
              }))
            }
          />
        </label>

        <label className="field">
          <span>Hero title Russian</span>
          <textarea
            value={content.hero.title.ru ?? ""}
            onChange={(event) =>
              setContent((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  title: { ...current.hero.title, ru: event.target.value }
                }
              }))
            }
          />
        </label>

        <label className="field">
          <span>رابط صورة الواجهة</span>
          <input
            value={content.hero.imageUrl}
            onChange={(event) =>
              setContent((current) => ({
                ...current,
                hero: { ...current.hero, imageUrl: event.target.value }
              }))
            }
          />
        </label>
      </div>

      <div className="editor-grid">
        <label className="field">
          <span>نبذة بالعربية</span>
          <textarea
            value={content.about.body.ar ?? ""}
            onChange={(event) =>
              setContent((current) => ({
                ...current,
                about: {
                  ...current.about,
                  body: { ...current.about.body, ar: event.target.value }
                }
              }))
            }
          />
        </label>

        <label className="field">
          <span>About body English</span>
          <textarea
            value={content.about.body.en ?? ""}
            onChange={(event) =>
              setContent((current) => ({
                ...current,
                about: {
                  ...current.about,
                  body: { ...current.about.body, en: event.target.value }
                }
              }))
            }
          />
        </label>
      </div>

      <p className={`save-status ${status}`}>
        {status === "saved" && "تم حفظ المحتوى. افتح الصفحة العامة أو غيّر اللغة لترى النتيجة."}
        {status === "error" && "لم يتم الحفظ. تأكد أن API Gateway يعمل."}
      </p>
    </article>
  );
}
