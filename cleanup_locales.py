import json
import os

languages = ["am", "ar", "bn", "fa", "he", "hi", "id", "it", "ja", "ko", "pl", "pt", "ru", "ta", "th", "tr", "vi", "zh"]
root_dir = "/media/n_emperor/Aadhish/Projects/NSA-Tools/Texttohandwriting/public/locales/"

replacements = {
    "am": {
        "blog_title": "ግንዛቤዎች",
        "faq_q6": "እነዚህን ሰነዶች ለማተም የተሻለው መንገድ ምንድነው?",
        "faq_a6": "ትክክለኛውን ልኬት እና ጥራት ለመጠበቅ ወደ PDF እንዲልኩ እና በአታሚ ቅንብሮችዎ ውስጥ 'ትክክለኛ መጠን' እንዲጠቀሙ እንመክራለን።",
        "privacy_cookies": "ማስታወቂያዎችን ለማቅረብ Google AdSenseን እንጠቀማለን። AdSense በዚህ እና በሌሎች ድረ-ገጾች ላይ ባደረጉት ጉብኝት መሰረት ማስታወቂያዎችን ለማቅረብ ኩኪዎችን ይጠቀማል። የGoogle ማስታወቂያ ቅንብሮችን በመጎብኘት ግላዊ ከሆኑ ማስታወቂያዎች መውጣት ይችላሉ።",
        "terms_ads": "ማስታወቂያዎችን ለማቅረብ Google AdSenseን እንጠቀማለን። እነዚህ አገልግሎቶች ተዛማጅ ይዘቶችን ለማቅረብ ኩኪዎችን ሊጠቀሙ ይችላሉ። ለዝርዝሮች እባክዎን የእኛን የግላዊነት ፖሊሲ ይመልከቱ።",
        "slang": {
            "vibe": "ሁኔታ", "glow-up": "ማሻሻያ", "bestie": "ጓደኛ", "hype": "ፍላጎት", "wingman": "ረዳት", "The Tea": "ግንዛቤዎች", "serial procrastinators": "ተማሪዎች እና ባለሙያዎች"
        }
    },
    "ar": {
        "blog_title": "مقالات",
        "faq_q6": "ما هي أفضل طريقة لطباعة هذه المستندات؟",
        "faq_a6": "نوصي بالتصدير إلى ملف PDF واستخدام 'الحجم الفعلي' في إعدادات الطابعة للحفاظ على الحجم والدقة الصحيحين.",
        "privacy_cookies": "نحن نستخدم Google AdSense لعرض الإعلانات. يستخدم AdSense ملفات تعريف الارتباط لعرض الإعلانات بناءً على زياراتك لهذا الموقع والمواقع الأخرى. يمكنك اختيار عدم قبول الإعلانات المخصصة من خلال زيارة إعدادات إعلانات Google.",
        "terms_ads": "نحن نستخدم Google AdSense لتقديم الإعلانات. قد تستخدم هذه الخدمات ملفات تعريف الارتباط لتقديم محتوى ذي صلة. يرجى الرجوع إلى سياسة الخصوصية الخاصة بنا للحصول على التفاصيل.",
        "slang": {
            "vibe": "أجواء", "glow-up": "تحسين", "bestie": "صديق", "hype": "ضجة", "wingman": "مساعد", "The Tea": "مقالات", "استيتيك": "جمالية", "لايف‑هاك": "نصيحة", "غلو‑أب": "تحسين", "الـwingman": "المساعد", "الـfeed": "التغذية الإخبارية", "البلানر": "المخطط", "ستوري": "قصة", "ميمز": "رسومات ساخرة", "مماطلين مزمنين": "الطلاب والمحترفين", "ميمية": "إبداعية"
        }
    },
    "bn": {
        "blog_title": "নিবন্ধ",
        "faq_q6": "এই নথিগুলি মুদ্রণ করার সর্বোত্তম উপায় কী?",
        "faq_a6": "সঠিক স্কেলিং এবং রেজোলিউশন বজায় রাখতে আমরা PDF এ এক্সপোর্ট করার এবং আপনার প্রিন্টার সেটিংসে 'আসল আকার' ব্যবহার করার পরামর্শ দিই।",
        "privacy_cookies": "আমরা বিজ্ঞাপন পরিবেশন করতে Google AdSense ব্যবহার করি। আপনার এই এবং অন্যান্য ওয়েবসাইট পরিদর্শনের উপর ভিত্তি করে বিজ্ঞাপন পরিবেশন করতে AdSense কুকি ব্যবহার করে। আপনি Google-এর বিজ্ঞাপন সেটিংস দেখে ব্যক্তিগতকৃত বিজ্ঞাপন থেকে অপ্ট আউট করতে পারেন।",
        "terms_ads": "আমরা বিজ্ঞাপন পরিবেশন করতে Google AdSense ব্যবহার করি। এই পরিষেবাগুলি প্রাসঙ্গিক বিষয়বস্তু প্রদানের জন্য কুকি ব্যবহার করতে পারে। বিস্তারিত জানার জন্য দয়া করে আমাদের গোপনীয়তা নীতি দেখুন।",
        "slang": {
            "ভাইব": "পরিবেশ", "গ্লো-আপ": "উন্নতি", "বেস্টি": "বন্ধু", "হ্যাক": "কৌশল", "হাইপ": "উত্তেজনা", "উইংম্যান": "সহকারী", "সিরিয়াল প্রোক্রাস্টিনেটর": "শিক্ষার্থী এবং পেশাদার"
        }
    },
    "hi": {
        "blog_title": "लेख",
        "faq_q6": "इन दस्तावेजों को प्रिंट करने का सबसे अच्छा तरीका क्या है?",
        "faq_a6": "हम सही स्केलिंग और रिज़ॉल्यूशन बनाए रखने के लिए PDF में एक्सपोर्ट करने और अपने प्रिंटर सेटिंग्स में 'एक्चुअल साइज़' का उपयोग करने की सलाह देते हैं।",
        "privacy_cookies": "हम विज्ञापन दिखाने के लिए Google AdSense का उपयोग करते हैं। AdSense आपकी इस और अन्य वेबसाइटों की यात्राओं के आधार पर विज्ञापन दिखाने के लिए कुकीज़ का उपयोग करता है। आप Google की विज्ञापन सेटिंग्स पर जाकर व्यक्तिगत विज्ञापनों से बाहर निकल सकते हैं।",
        "terms_ads": "हम विज्ञापन दिखाने के लिए Google AdSense का उपयोग करते हैं। ये सेवाएँ प्रासंगिक सामग्री प्रदान करने के लिए कुकीज़ का उपयोग कर सकती हैं। विवरण के लिए कृपया हमारी गोपनीयता नीति देखें।",
        "slang": {
            "वाइब": "अनुभव", "glow-up": "सुधार", "Glow Up": "निखार", "bestie": "मित्र", "बेस्टी": "मित्र", "हाइप": "उत्साह", "wingman": "सहायक", "The Tea": "लेख", "मीम-लेवल": "रचनात्मक", "सीरियल प्रॉक्रैस्टिनेटर्स": "छात्र और पेशेवर", "रोस्ट करना": "आलोचना करना"
        }
    },
    "it": {
        "blog_title": "Articoli",
        "faq_q6": "Qual è il modo migliore per stampare questi documenti?",
        "faq_a6": "Consigliamo di esportare in PDF e utilizzare 'Dimensioni effettive' nelle impostazioni della stampante per mantenere la scala e la risoluzione corrette.",
        "privacy_cookies": "Utilizziamo Google AdSense per pubblicare annunci. AdSense utilizza i cookie per pubblicare annunci basati sulle tue visite a questo e ad altri siti web. Puoi scegliere di non ricevere pubblicità personalizzata visitando le Impostazioni annunci di Google.",
        "terms_ads": "Utilizziamo Google AdSense per pubblicare annunci pubblicitari. Questi servizi possono utilizzare i cookie per fornire contenuti pertinenti. Si prega di fare riferimento alla nostra Informativa sulla privacy per i dettagli.",
        "slang": {
            "vibe": "atmosfera", "glow-up": "miglioramento", "bestie": "amico", "hype": "interesse", "wingman": "assistente", "The Tea": "Articoli", "411": "informazioni", "floppando": "perdendo interesse", "procrastinatori seriali": "studenti e professionisti", "hot take": "opinioni"
        }
    },
    "ja": {
        "blog_title": "記事",
        "faq_q6": "これらの文書を印刷する最良の方法は何ですか？",
        "faq_a6": "正しい縮尺と解像度を維持するために、PDFにエクスポートしてプリンター設定で「実際のサイズ」を使用することをお勧めします。",
        "privacy_cookies": "広告の配信に Google AdSense を使用しています。AdSense は、ユーザーが当サイトや他のウェブサイトにアクセスした際の情報に基づいて広告を表示するために Cookie を使用します。ユーザーは Google の広告設定でパーソナライズ広告を無効にできます。",
        "terms_ads": "広告の配信に Google AdSense を使用しています。これらのサービスは、関連性の高いコンテンツを提供するために Cookie を使用する場合があります。詳細はプライバシーポリシーを参照してください。",
        "slang": {
            "ハック": "テクニック", "盛る": "充実させる", "映える": "魅力的に見える", "グローアップ": "向上", "味方": "サポート", "ギリギリまで粘る人": "学生や社会人", "The Tea": "記事"
        }
    },
    "id": {
        "blog_title": "Artikel",
        "faq_q6": "Apa cara terbaik untuk mencetak dokumen-dokumen ini?",
        "faq_a6": "Kami merekomendasikan mengekspor ke PDF dan menggunakan 'Ukuran Sebenarnya' di pengaturan printer Anda untuk menjaga penskalaan dan resolusi yang benar.",
        "privacy_cookies": "Kami menggunakan Google AdSense untuk menayangkan iklan. AdSense menggunakan cookie untuk menayangkan iklan berdasarkan kunjungan Anda ke situs ini dan situs web lainnya. Anda dapat memilih untuk tidak menerima iklan yang dipersonalisasi dengan mengunjungi Setelan Iklan Google.",
        "terms_ads": "Kami menggunakan Google AdSense untuk menayangkan iklan. Layanan ini dapat menggunakan cookie untuk menyediakan konten yang relevan. Silakan lihat Kebijakan Privasi kami untuk detailnya.",
        "slang": {
            "vibe": "suasana", "glow-up": "peningkatan", "bestie": "teman", "The Tea": "Artikel"
        }
    },
    "pt": {
        "blog_title": "Artigos",
        "faq_q6": "Qual é a melhor maneira de imprimir estes documentos?",
        "faq_a6": "Recomendamos exportar para PDF e usar 'Tamanho Real' nas configurações da sua impressora para manter a escala e resolução corretas.",
        "privacy_cookies": "Utilizamos o Google AdSense para apresentar anúncios. O AdSense utiliza cookies para apresentar anúncios com base nas suas visitas a este e a outros websites. Pode optar por não receber publicidade personalizada visitando as Definições de Anύνcios do Google.",
        "terms_ads": "Utilizamos o Google AdSense para apresentar anúncios. Estes serviços podem utilizar cookies para fornecer conteúdo relevante. Consulte a nossa Política de Privacidade para mais detalhes.",
        "slang": {
            "vibe": "atmosfera", "glow-up": "melhoria", "bestie": "amigo", "The Tea": "Artigos"
        }
    },
    "ru": {
        "blog_title": "Статьи",
        "faq_q6": "Как лучше всего распечатать эти документы?",
        "faq_a6": "Мы рекомендуем экспортировать в PDF и использовать «Реальный размер» в настройках принтера для сохранения правильного масштаба и разрешения.",
        "privacy_cookies": "Мы используем Google AdSense для показа рекламы. AdSense использует файлы cookie для показа объявлений на основе ваших посещений этого и других веб-сайтов. Вы можете отказаться от персонализированной рекламы в разделе «Настройки рекламных предпочтений» Google.",
        "terms_ads": "Мы используем Google AdSense для показа рекламы. Эти сервисы могут использовать файлы cookie для предоставления релевантного контента. Пожалуйста, ознакомьтесь с нашей Политикой конфиденциальности для получения подробной информации.",
        "slang": {
            "вайб": "атмосфера", "glow-up": "улучшение", "The Tea": "Статьи", "хайп": "ажиотаж", "бести": "друг"
        }
    },
    "zh": {
        "blog_title": "文章",
        "faq_q6": "打印这些文件的最佳方式是什么？",
        "faq_a6": "我们建议导出为 PDF 并在打印机设置中使用“实际大小”，以保持正确的缩放比例和分辨率。",
        "privacy_cookies": "我们使用 Google AdSense 投放广告。AdSense 使用 Cookie 根据您对此网站及其他网站的访问情况来投放广告。您可以访问 Google 广告设置来退出个性化广告。",
        "terms_ads": "我们使用 Google AdSense 投放广告。这些服务可能会使用 Cookie 来提供相关内容。请参阅我们的隐私政策了解详情。",
        "slang": {
            "氛围": "环境", "The Tea": "文章", "大爆": "流行", "避雷": "建议", "种草": "推荐"
        }
    }
}

general_slang = {
    "vibe": "atmosphere",
    "glow-up": "improvement",
    "glow up": "improvement",
    "glow\u2011up": "improvement",
    "bestie": "friend",
    "hype": "excitement",
    "wingman": "assistant",
    "hot take": "perspective",
    "The Tea": "Insights",
    "serial procrastinators": "students and professionals",
    "dQw4w9WgXcQ": "professional printing advice"
}

def process_file(lang):
    path = os.path.join(root_dir, lang, "translation.json")
    if not os.path.exists(path):
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "blog" in data and "title" in data["blog"]:
        if lang in replacements and "blog_title" in replacements[lang]:
            data["blog"]["title"] = replacements[lang]["blog_title"]
        else:
            data["blog"]["title"] = "Articles"

    if "pages" in data and "faq" in data["pages"]:
        faq = data["pages"]["faq"]
        if lang in replacements:
            faq["q6"] = replacements[lang]["faq_q6"]
            faq["a6"] = replacements[lang]["faq_a6"]
        else:
            faq["q6"] = "What is the best way to print these documents?"
            faq["a6"] = "We recommend exporting to PDF and using 'Actual Size' in your printer settings to maintain correct scaling and resolution."

    if "pages" in data and "privacy" in data["pages"]:
        privacy = data["pages"]["privacy"]
        if lang in replacements:
            privacy["cookiesContent"] = replacements[lang]["privacy_cookies"]
        else:
            privacy["cookiesContent"] = "We use Google AdSense to serve ads. AdSense uses cookies to serve ads based on your visits to this and other websites. You may opt out of personalized advertising by visiting Google's Ad Settings."

    if "pages" in data and "terms" in data["pages"]:
        terms = data["pages"]["terms"]
        if lang in replacements:
            terms["section4Content"] = replacements[lang]["terms_ads"]
        else:
            terms["section4Content"] = "We use Google AdSense to serve advertisements. These services may use cookies to provide relevant content. Please refer to our Privacy Policy for details."

    lang_specific_slang = replacements.get(lang, {}).get("slang", {})
    all_slang = {**general_slang, **lang_specific_slang}

    def replace_slang(obj):
        if isinstance(obj, dict):
            return {k: replace_slang(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [replace_slang(i) for i in obj]
        elif isinstance(obj, str):
            for s, r in all_slang.items():
                obj = obj.replace(s, r)
            return obj
        return obj

    data = replace_slang(data)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

for lang in languages:
    process_file(lang)
