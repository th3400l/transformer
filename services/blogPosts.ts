/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { TFunction } from 'i18next';
import { getLanguageInfo } from './languageConfig';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'benefits-of-handwritten-notes',
    title: 'Cognitive Benefits of Handwritten Notes: Why Analog Matters',
    date: '2025-09-17',
    author: 'Editorial Team',
    content: `
        <p>
          In an era dominated by rapid digital typing, the traditional practice of writing by hand remains a powerful tool for cognitive development and memory retention. Research consistently shows that the act of handwriting engages the brain in ways that typing cannot replicate.
        </p>
        <h2>The Science of Memory Retention</h2>
        <p>
          When you write by hand, your brain is forced to process information more deeply. Unlike typing, which is a repetitive mechanical motion, handwriting involves complex strokes for each letter. This "haptic" engagement creates a stronger motor memory in the brain, making it easier to recall information during exams or meetings.
        </p>
        <h2>Digital-to-Analog Workflows</h2>
        <p>
          Our <strong>text-to-handwriting converter</strong> serves as a bridge for those who prefer the speed of typing but desire the visual and cognitive advantages of handwritten text. By converting your digital notes into a realistic handwritten format, you can create study materials that are more engaging and easier for the brain to process visually.
        </p>
        <h2>Enhancing Focus and Reducing Distraction</h2>
        <p>
          Working with handwritten-style documents can also help reduce the "digital fatigue" associated with standard sans-serif fonts. The natural variations in our <strong>free handwriting tool</strong> provide a more organic reading experience, which can lead to better focus and longer attention spans during study sessions.
        </p>
      `,
  },
  {
    slug: 'effective-study-materials',
    title: 'Creating Effective Study Materials with Handwriting Tools',
    date: '2025-09-17',
    author: 'Educational Specialist',
    content: `
        <p>
          Creating effective study guides is an art form. While digital tools have made information gathering easier, the presentation of that information is key to successful learning. Here is how you can use an <strong>online handwriting converter</strong> to elevate your educational materials.
        </p>
        <h2>Visual Hierarchy in Notes</h2>
        <p>
          Use different handwriting styles to distinguish between headings, key definitions, and supporting details. Our tool offers 9 unique handwriting fonts, allowing you to create a clear visual hierarchy. This makes it easier for your eyes to scan the page and find critical information quickly.
        </p>
        <h2>The Power of Customization</h2>
        <p>
          A high-quality <strong>text to handwriting online tool</strong> should allow for deep customization. By adjusting ink color (blue ink is often cited as better for memory) and paper templates, you can tailor your notes to your specific learning style. Whether you prefer lined paper for structure or blank pages for mind-mapping, the right backdrop matters.
        </p>
        <p>
          Incorporating these "handwritten" elements into your digital workflow allows you to maintain the organization of a computer while gaining the aesthetic and mnemonic benefits of a traditional notebook. This is particularly useful for students preparing for high-stakes examinations where retention is paramount.
        </p>
      `,
  },
  {
    slug: 'create-your-own-handwriting-font',
    title: 'Technical Guide: Creating Your Own Handwriting Font',
    date: '2025-09-26',
    author: 'Type Design Team',
    content: `
        <p>
          Personalization is at the heart of our platform. By uploading your actual handwriting as a font, you can maintain your unique identity in digital documents. This guide explains the technical steps required to create a compatible font file for <strong>txttohandwriting.org</strong>.
        </p>
        <h2>Step 1: Capturing High-Quality Samples</h2>
        <p>
          To create a realistic font, you must start with a clean sample. We recommend using a dark ink pen on bright white paper. Ensure that you write each character clearly, including uppercase, lowercase, numerals, and common punctuation marks. Consistency in baseline and x-height is crucial for a professional-looking result.
        </p>
        <ul>
          <li><strong>Digital Capture:</strong> Use a scanner at 300 DPI or a high-resolution camera in a well-lit environment.</li>
          <li><strong>Software Tools:</strong> Services like Calligraphr or Glyphr Studio can help you convert your scanned images into TTF or OTF files.</li>
        </ul>
        <h2>Step 2: Refining the Typeface</h2>
        <p>
          Once you have converted your samples, use a font editor to adjust the kerning (the space between letters) and the line height. Proper kerning prevents letters from overlapping awkwardly and ensures a natural flow, which is a hallmark of authentic handwriting.
        </p>
        <h2>Step 3: Implementation</h2>
        <p>
          After exporting your font in TTF, OTF, or WOFF format, head to our <strong>Custom Upload</strong> section. Our generator supports these formats natively, allowing you to see your personal writing style applied to any text instantly. This feature is widely used by professionals to add a "signed" feel to digital correspondence and by students who wish to submit digital assignments that reflect their personal work.
        </p>
      `,
  },
  {
    slug: 'science-of-paper-textures',
    title: 'Psychology of Paper Texture in Digital Learning',
    date: '2026-01-01',
    author: 'Design Researcher',
    content: `
        <p>
          Why do we feel more connected to information on a textured page than on a sterile white screen? The answer lies in environmental psychology. Our brains are evolved to interact with the physical world, and textures provide sensory cues that enhance our engagement with content.
        </p>
        <h2>Simulating Realism</h2>
        <p>
          Our handwriting generator doesn't just change the font; it simulates the <strong>micro-details</strong> of ink absorption on various paper types. Whether it's the slight "bleed" on a lined notebook page or the crisp edges on a premium template, these details signal to the brain that the content is "real" and therefore worth more attention.
        </p>
        <h2>Template Selection for Different Tasks</h2>
        <p>
          Choosing the right template is about more than just aesthetics. <strong>Grid paper</strong> is statistically shown to aid in the organization of mathematical and scientific data, while <strong>blank textured paper</strong> encourages more divergent, creative thinking. By matching your task to the correct template, you can optimize your mental performance.
        </p>
      `,
  },
  {
    slug: 'cursive-vs-print-handwriting',
    title: 'Cursive vs Print: Which Handwriting Style Should You Actually Practice?',
    date: '2026-02-04',
    author: 'Editorial Team',
    content: `
        <p>
          Walk into any classroom in the world and you will find this debate quietly playing out: should children learn cursive, print, or some hybrid? Adults face the same question whenever they decide to relearn handwriting after years of typing. The honest answer is that there is no universal winner — only trade-offs that depend on what you are using your handwriting <em>for</em>.
        </p>

        <h2>A Short History of the Decline of Cursive</h2>
        <p>
          For most of the twentieth century, cursive was the default style taught to schoolchildren in the English-speaking world. The arrival of standardised testing in the 1990s shifted the priority toward block-letter print, which scanners could grade more easily. By the early 2010s many curricula had quietly dropped cursive instruction altogether. The result is a generation of adults whose own signatures look like the print they learned in second grade.
        </p>
        <p>
          That decline has not gone unchallenged. Several U.S. states reintroduced cursive in 2024 and 2025, citing both motor-skill research and a desire for students to be able to read historical documents. The conversation is still open.
        </p>

        <h2>The Case for Print</h2>
        <p>
          Print letters are independent of one another, which gives them three honest advantages. They are easier to learn for beginners because each letter is a discrete unit. They are universally readable — even your worst print is generally legible to a stranger. And they fit modern note-taking conventions, where you might mix English text with code, equations, or diagrams.
        </p>
        <p>
          The trade-off is speed. Lifting your pen between every letter caps your writing rate at around 30 to 40 words per minute, depending on your dexterity. Over a 90-minute lecture, that ceiling becomes painful.
        </p>

        <h2>The Case for Cursive</h2>
        <p>
          Cursive is faster — often dramatically so. Connected letters reduce the number of pen lifts, which means less time spent in motion that produces no ink. Studies of court reporters and journalists from the pre-laptop era routinely document sustained handwriting speeds of 50 to 70 words per minute in cursive, well above what most print writers achieve.
        </p>
        <p>
          There is also a cognitive case. Research from the University of Stavanger and elsewhere has shown that the continuous motor pattern of cursive engages broader regions of the brain than typing or printing. Whether that translates into better learning outcomes is still debated, but the neural difference is measurable.
        </p>
        <p>
          The drawbacks are real too. Cursive takes longer to teach, the legibility ceiling is lower (your worst cursive is much harder for a stranger to read than your worst print), and many adults who learned cursive as children abandoned it so completely that relearning it feels like starting over.
        </p>

        <h2>The Hybrid That Most Adults Actually Use</h2>
        <p>
          If you study how working adults take notes today, you rarely see pure cursive or pure print. Most people drift into a personal hybrid: connected lowercase letters where it feels natural, broken letters where it does not, and printed capitals throughout. Italic handwriting, taught in some Montessori schools and to British grammar-school pupils through the mid-twentieth century, is essentially a formalised version of this hybrid.
        </p>
        <p>
          For most adults, deliberately practising italic for a few weeks produces the best return on investment. It keeps the speed advantage of connection without the legibility penalty of full cursive, and it looks attractive in journals and letters.
        </p>

        <h2>How a Digital Handwriting Tool Fits In</h2>
        <p>
          One of the most useful ways to practise a new handwriting style is to see what your text would look like in that style at full length, then mimic the strokes by hand. <strong>txttohandwriting.org</strong> includes both print-style and connected fonts, so you can paste a few paragraphs of your own writing and see how each style would render. Print the page out and trace it as a warm-up exercise before drafting in your own hand.
        </p>
        <p>
          For people whose handwriting is illegible enough that taking notes for others is painful, the tool also serves as a stopgap: type your notes, render them in a hand that resembles your own, and share the result. That is not a substitute for practising the underlying skill, but it removes the immediate friction.
        </p>

        <h2>A Practical Recommendation</h2>
        <p>
          If you are an adult deciding what to practise: start with print until your everyday writing is fully legible, then layer in connections one letter pair at a time. Within a month or two you will have a personal italic that is faster than print and more legible than cursive. If you are a parent making the choice for a child, ensure they can print clearly first — cursive is much easier to layer onto a strong print foundation than the other way around.
        </p>
      `,
  },
  {
    slug: 'cornell-notes-by-hand',
    title: 'How to Take Cornell Notes by Hand: A Practical Walkthrough',
    date: '2026-02-18',
    author: 'Educational Specialist',
    content: `
        <p>
          The Cornell note-taking system was developed by Walter Pauk at Cornell University in the 1950s and has since become the most widely-recommended manual note-taking method in higher education. The reason it has lasted is not that the format is clever — it is not, particularly — but that it forces you to do the thing that most students forget to do: <em>review your notes within twenty-four hours of writing them</em>.
        </p>

        <h2>The Page Layout</h2>
        <p>
          A Cornell page is divided into three regions. On a standard A4 or US Letter sheet, draw a vertical line about 6.5 cm (2.5 inches) from the left edge, running from the top of the page down to about 5 cm (2 inches) above the bottom. Then draw a horizontal line across the page at that 5 cm mark. The page now has three zones:
        </p>
        <ul>
          <li><strong>Notes column (right of the vertical line):</strong> the largest area. You take your live notes here during the lecture or while reading.</li>
          <li><strong>Cue column (left of the vertical line):</strong> a narrower column reserved for keywords and questions you fill in <em>after</em> the lecture.</li>
          <li><strong>Summary band (below the horizontal line):</strong> a few lines at the bottom for a personal summary of the page, written within twenty-four hours.</li>
        </ul>
        <p>
          You can pre-rule pages in a notebook in batches of ten, or buy printed Cornell-format pads. The format itself is not what matters; the discipline of using all three regions is.
        </p>

        <h2>During the Lecture</h2>
        <p>
          In the notes column, capture ideas, not full sentences. Use short bullet points, abbreviations, and indentation to show structure. Resist the temptation to transcribe the speaker word for word — you are listening, not stenographing. If a slide has dense technical content, write the headline and a reminder to copy the slide later, then return your attention to the speaker.
        </p>
        <p>
          Leave whitespace between distinct topics. The temptation to fill every line is strong, especially if you have nice paper, but Cornell notes work because there is room to add things later.
        </p>

        <h2>The Cue-Extraction Pass</h2>
        <p>
          Within a few hours of the lecture, sit with your notes and re-read each page. In the cue column, write a keyword or short question for every meaningful block of notes. The question should be one whose answer is contained in the notes block beside it. For example, if your notes describe the mechanism of an enzyme, the cue might be <em>"How does enzyme X catalyse Y?"</em>.
        </p>
        <p>
          This step is the heart of the system. It forces you to re-engage with the material and to think about it in terms of questions rather than statements. Questions are how memory is later retrieved, so framing the cues this way builds the recall pathway in advance.
        </p>

        <h2>The Summary</h2>
        <p>
          Before you go to bed, write two or three sentences in the summary band at the bottom of each page describing what the page is about in your own words. The instruction "in your own words" is non-negotiable — copying phrases from the notes defeats the purpose. If you cannot summarise the page from memory, that is the signal that you have not yet understood the material and need to revisit it.
        </p>

        <h2>Reviewing</h2>
        <p>
          The Cornell system is built around an active recall workflow. To review, cover the notes column with a sheet of paper, look only at the cues, and try to answer each one out loud or in writing. Then uncover the notes column to check yourself. This is the same flashcard logic Anki users follow, but built into the page rather than into a separate app.
        </p>
        <p>
          Reviewing once after twenty-four hours, again after a week, and again before the exam is enough for most material. Spaced repetition does the heavy lifting; the format just makes it easy.
        </p>

        <h2>Common Mistakes</h2>
        <p>
          The mistake almost everyone makes when first using Cornell notes is leaving the cue column blank. Without cues, the system reduces to ordinary linear notes with extra whitespace. Force yourself to fill the cue column the same day, even if some cues feel unsatisfying. They will improve with practice.
        </p>
        <p>
          The other common failure is over-formatting. People spend so long ruling pages, choosing pen colours, and adjusting margins that they never actually study. The format exists to support the work, not to replace it.
        </p>

        <h2>Adapting Cornell Notes Digitally</h2>
        <p>
          If you want the cognitive benefits of handwriting but prefer to start from a typed outline — for example, when reading a textbook on a laptop — paste your typed key points into <strong>txttohandwriting.org</strong>, render them in a clean handwritten font on a Cornell-style template, and print the result. You then add cues and summaries by hand on the printed page. This hybrid catches you the encoding benefit of handwritten review without the time cost of writing every original note longhand.
        </p>
        <p>
          For students who simply cannot keep up with a fast lecturer in handwriting, this is also a practical accommodation: type during class, hand-process afterwards. The active recall step is what produces the learning gains; the act of typing the original notes is just data capture.
        </p>
      `,
  },
  {
    slug: 'pen-and-paper-combinations',
    title: 'Best Pen and Paper Combinations for Every Writing Style',
    date: '2026-03-04',
    author: 'Type Design Team',
    content: `
        <p>
          Most people pick a pen because it was nearby and pick paper because it was cheap. The result is that they have never experienced what their handwriting actually looks like with a properly matched combination. This guide is for the moment you decide to take that more seriously — whether you are choosing materials for a journal, a calligraphy practice, or simply a notebook you will not regret carrying for a year.
        </p>

        <h2>Why the Pairing Matters</h2>
        <p>
          Pen ink and paper fibre interact in three ways: absorption, feathering, and show-through. <em>Absorption</em> is how quickly the paper soaks the ink. Too fast, and a fountain pen will bleed through; too slow, and a ballpoint will smear. <em>Feathering</em> is the spread of ink along paper fibres, which makes letters look fuzzy. <em>Show-through</em> is the ghost image of writing visible on the back of the page, which limits how thin your paper can be without becoming distracting.
        </p>
        <p>
          Manufacturers describe paper using grams per square metre (GSM) — a rough proxy for thickness. 80 GSM is standard copier paper. 90 to 100 GSM is typical for premium notebooks. 120 GSM and above is generally fountain-pen friendly. But GSM is only part of the story; the paper's coating and fibre composition matter just as much.
        </p>

        <h2>Ballpoint Pens</h2>
        <p>
          Ballpoints use a thick, oil-based ink that sits on top of the paper rather than sinking into it. They work on virtually anything, which is why they dominated the twentieth century. The trade-off is that they require firm pressure, which produces hand fatigue over long sessions and embosses the page beneath the one you are writing on.
        </p>
        <p>
          <strong>Best paper for ballpoint:</strong> ordinary 80 GSM copy paper, or any standard notebook. Premium paper is wasted on a ballpoint — the ink does not have the depth to take advantage of it.
        </p>

        <h2>Gel Pens</h2>
        <p>
          Gel pens use a water-based pigment ink that flows freely. They are the most forgiving pen type for adult learners because they require almost no pressure, which makes long writing sessions painless. They smear if you write left-handed and brush your hand across the page before the ink dries.
        </p>
        <p>
          <strong>Best paper for gel:</strong> smooth 90 to 100 GSM paper. Rhodia, Clairefontaine, and the Leuchtturm1917 are all reliable choices. Avoid heavily textured paper, which catches the gel tip and produces a scratchy line.
        </p>

        <h2>Rollerballs</h2>
        <p>
          Rollerballs sit between ballpoints and gel pens. They use water-based ink like a gel pen, but with a more controlled flow. The line is darker and more saturated than a gel pen on the same paper. They have replaced gel pens in many professional settings for that reason.
        </p>
        <p>
          <strong>Best paper for rollerball:</strong> 90 to 110 GSM with a smooth finish. Most office stationery in this range works well. Cheaper paper produces feathering that becomes obvious in any handwriting style with thick downstrokes.
        </p>

        <h2>Felt-Tip and Fineliner Pens</h2>
        <p>
          Fineliners use a porous tip that delivers a precise, consistent line. They are the standard for technical drawing, journaling, and any handwriting style that benefits from a uniform stroke weight. Sakura's Pigma Micron and Faber-Castell's Pitt Artist Pens are widely regarded benchmarks.
        </p>
        <p>
          <strong>Best paper for fineliner:</strong> any smooth paper of 80 GSM or higher. Avoid recycled paper, where uneven fibres can dry out the porous tip prematurely.
        </p>

        <h2>Fountain Pens</h2>
        <p>
          Fountain pens are the most paper-sensitive of any writing tool. A cheap fountain pen on premium paper outperforms an expensive fountain pen on cheap paper every time. The ink is a thin, water-based solution that sits in the paper's surface and shows off any flaws.
        </p>
        <p>
          <strong>Best paper for fountain pen:</strong> Tomoe River 52 GSM is the connoisseur's choice — astonishingly thin yet completely fountain-pen friendly. For everyday use, Rhodia (80 to 90 GSM) and Leuchtturm1917 (80 GSM) are excellent. Clairefontaine's Triomphe is the classic correspondence paper. Avoid most American legal pads, which feather aggressively.
        </p>

        <h2>Notebook Recommendations</h2>
        <p>
          For a single recommendation that works for almost everyone: a Leuchtturm1917 A5 hardcover, used with a fineliner or rollerball. The paper is forgiving across pen types, the format fits in any bag, and the numbered pages and built-in index make it suitable for bullet journaling and Cornell-style notes alike.
        </p>
        <p>
          For fountain-pen users on a budget, the Midori MD notebook is the best value in the category. For minimum cost with no fountain-pen ambitions, a generic ruled notebook from any office supply shop will do — your handwriting practice matters more than the notebook brand.
        </p>

        <h2>Bringing It Back to Digital</h2>
        <p>
          When you generate handwritten output through <strong>txttohandwriting.org</strong>, the paper template you choose affects perceived realism more than most users realise. Lined templates emphasise the baseline and suit print-style fonts. Dotted templates suit bullet journaling. Plain templates suit calligraphy. If you intend to print your generated pages and write on top of them, choose a template that matches the actual paper you will be writing on so the printed lines align naturally with your real notebook.
        </p>
      `,
  },
  {
    slug: 'bullet-journaling-101',
    title: 'Bullet Journaling 101: A Beginner\'s Setup Guide',
    date: '2026-03-22',
    author: 'Editorial Team',
    content: `
        <p>
          Bullet journaling was created by Ryder Carroll, a digital product designer with attention difficulties who needed an analog system that did not punish him for jumping between tasks. The system he built has since become a global hobby, but the version most people see online — pages of hand-drawn calligraphy and watercolour spreads — is decoration, not the system. The actual system fits on a single page and takes about ten minutes to learn.
        </p>

        <h2>What You Need</h2>
        <p>
          A notebook with numbered pages and a single pen. That is genuinely all. The official BuJo notebook is a Leuchtturm1917 in A5, but any notebook with numbered pages or one in which you are willing to number them yourself will work. If your notebook has dotted rather than lined pages, you have more flexibility for layouts; if it has plain ruled lines, you can still do everything the system requires.
        </p>

        <h2>The Index</h2>
        <p>
          Reserve the first two or three spreads of the notebook for an index. As you create new collections elsewhere in the notebook, you write the collection's title and page numbers in the index. This is the load-bearing wall of the entire system. Without an index, your notebook is a stack of pages you will never find anything in. With one, it is a personal database.
        </p>

        <h2>The Future Log</h2>
        <p>
          After the index, set aside four or six pages for the future log. Divide each page into sections labelled with the months ahead. When something happens that affects a future month — a birthday, a deadline, a planned trip — write it in the appropriate month's section. Once a month rolls around, you migrate the relevant items into your monthly log.
        </p>

        <h2>The Monthly Log</h2>
        <p>
          On the first of each month, set up a monthly spread. Carroll's original format is two facing pages: a vertical list of dates down the left page (with major events beside them), and a list of monthly tasks on the right. People modify this constantly — calendars, habit trackers, mood charts — but the function is unchanged: a single view of the month in front of you.
        </p>

        <h2>The Daily Log</h2>
        <p>
          The daily log is where the system earns its name. Each day, write the date as a header and bullet your tasks, events, and notes underneath using the bullet system below. When you run out of room, the next day's date simply goes underneath. There are no pre-printed daily pages to fill or skip — the notebook flows organically.
        </p>

        <h2>The Bullet System</h2>
        <ul>
          <li><strong>·</strong> a dot represents a task</li>
          <li><strong>○</strong> an open circle represents an event</li>
          <li><strong>—</strong> a dash represents a note</li>
        </ul>
        <p>
          When you complete a task, you cross the dot into an X. When you decide a task is no longer relevant, you strike through it. When a task did not get done today and needs to move forward, you draw a right-pointing arrow next to it (signifying migration) and rewrite it on a future day or in next month's monthly log. A left-pointing arrow signifies an item migrated back into the future log for a later month.
        </p>

        <h2>The Migration Ritual</h2>
        <p>
          At the end of each month, reread your past month's daily logs. For each unfinished task, decide consciously whether to migrate it forward, push it to a future month, or strike it through. This thirty-minute review is what separates bullet journaling from a glorified to-do list — it forces you to confront the items you keep avoiding and to delete the ones that no longer matter.
        </p>

        <h2>Collections</h2>
        <p>
          A collection is any themed page that lives outside the chronological flow: a reading list, a packing checklist, project notes, meeting minutes. You start a collection on the next blank page in the notebook, give it a title, and add it to the index. Collections can be a single page or twenty pages long. The numbered index is what makes them findable.
        </p>

        <h2>Common Beginner Mistakes</h2>
        <p>
          The most common failure mode is decoration overwhelming function. Beginners spend hours designing elaborate monthly spreads they never use, then abandon the notebook after two weeks because keeping up with the design feels exhausting. Carroll's own notebooks are remarkably plain. Start ugly. You can decorate later if you genuinely want to.
        </p>
        <p>
          The second common failure is forgetting to do the migration ritual. Without it, the notebook accumulates uncompleted tasks indefinitely. The ritual is the only step that produces the system's promised clarity.
        </p>

        <h2>The Hybrid With Digital Tools</h2>
        <p>
          Bullet journaling is sometimes presented as anti-digital, but the original creator uses both. Calendars, contact databases, and reference material live happily in apps; the journal handles the tasks, the daily log, and the long-form thinking. Many users print typed notes from web tools — including <strong>txttohandwriting.org</strong> when they want the printed material to feel like it belongs in the notebook visually — and paste them into collection pages. The notebook is the centre of attention; everything else is a satellite.
        </p>

        <h2>Time Investment</h2>
        <p>
          Realistic numbers: ten minutes a day for the daily log, fifteen minutes at the start of each month for the monthly setup, and thirty minutes at the end of each month for the migration. About ninety minutes a month, total. If you find yourself spending more, the decoration has eaten the system; trim it back until the time investment makes sense for the value you are receiving.
        </p>
      `,
  },
];

const buildBlogTranslationKey = (slug: string, field: 'title' | 'content'): string =>
  `blogPosts.${slug}.${field}`;

export const getLocalizedBlogPost = (t: TFunction, slug: string): BlogPost | undefined => {
  const post = blogPosts.find((entry) => entry.slug === slug);
  if (!post) {
    return undefined;
  }

  return {
    ...post,
    title: t(buildBlogTranslationKey(post.slug, 'title'), post.title),
    content: t(buildBlogTranslationKey(post.slug, 'content'), post.content)
  };
};

export const getLocalizedBlogPosts = (t: TFunction): BlogPost[] =>
  blogPosts.map((post) => ({
    ...post,
    title: t(buildBlogTranslationKey(post.slug, 'title'), post.title),
    content: t(buildBlogTranslationKey(post.slug, 'content'), post.content)
  }));

export const formatBlogDate = (date: string, languageCode?: string | null): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  const locale = getLanguageInfo(languageCode)?.locale || 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(parsed);
  } catch {
    return date;
  }
};
