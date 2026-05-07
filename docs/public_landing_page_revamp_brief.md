# Public Landing Page Revamp Brief

Related: [README](../README.md) | [App shell V1](app_shell_v1.md) | [Frontend foundations V1](frontend_foundations_v1.md) | [Pilot_todo](pilot_todo.md) | [Decision log](decision_log.md) | [Work sessions log](work_sessions.md)

## Purpose

Use this file as the paste-ready brief for the next public landing page revamp.

Scope:

- route: `/`
- primary file: `app/page.tsx`
- shared shell: `components/layout/public-shell.tsx`
- relevant copy/i18n layer: `lib/i18n/ui-copy.ts` and related public-route copy helpers

This document is for instructions, constraints, and desired copy/layout direction before implementation. It should not become a changelog after the revamp is built; move final decisions into [App shell V1](app_shell_v1.md), [Pilot_todo](pilot_todo.md), or [Decision log](decision_log.md) as appropriate.

---

## Goals

**Mood:** warm, bright, calm, trustworthy.

**Visual direction:** joyful but not toy-like. More “friendly learning studio” than “kids’ app.”

**Core metaphor:** banban is a learning companion who helps students walk through homework, build maps of knowledge, practice weak spots, and grow more independent.

Use soft cards, rounded sections, gentle illustrations, handwritten-style accents only in small doses, and clear adult-facing reassurance.

## Audience

Students, Parents and Tutors each have a dedicated interface, displayed according the identity chooser. The layout should change instantly without delay when the identity is switched.

## Page Structure

Only the Navbar is not identity-dependent.
Navbar: full width, hidden on scrolldown, visible on scroll up.
Title:
1st CTA:
Features: default layout with a section title and description, a large GIF/demo occupying about two-thirds of the desktop width, and three adjacent cards with titles and descriptions.


## Title & 1st CTA

### Student

Title: Meet banban, he's your AI homework coach.

Subtitle: Get step-by-step help with your howmework. Drill for exams and boost your grades. Explore the topics you like. banban's Big_Brain keeps track of what you need to strengthen and will prepare practice just for you!

CTA: "Sign up for free"

### Parent
This should be the strongest version. Parents need reassurance, safety, and a clear reason why this is better than generic ChatGPT.

Title: A safer way to let AI help with homework.

Subtitle: banban is designed to coach your child through learning and Socratic quesitoning instead of simply giving answers. It helps with homework, revision, writing, and practice — while keeping tracking of the areas in need of imprvement in its long-term memory. By linking a student account to your, you get clearer visibility into their progress, struggles, and support needs. *(Overlay link)* See how parent oversight works.

Overlay: *(in progress)*
*a list of the info parents do and don't have access to. What they can ask banban about the learner account.*
*is your child struggling? are they done and deserve some rest? or maybe you want to ensure that their class is not getting behing on the year's curriculum*
*more detais in the FAQ*

CTA: "Create a free parent account"

### Tutor

Title: Know what your student struggled with before the session starts.

Subtitle: banban gives tutors a clearer view of linked students’ homework sessions, summaries, weak points, and learning patterns — so tutoring time can be more focused, personal, and effective. *(Overlay link)* See how tutor oversight works.

Overlay: *(in progress)* a list of the info tutors do and don't have access to. What they can ask banban about the learner account.

CTA: "Create a free tutor account"

## Feature section

### Student
(placeholder)

### Parent

Feature 1: left/right split section and a full-width title and demo gif.

Title: AI should not replace the learner’s thinking. It should help them build it.

Left card 1.1: **When AI becomes a shortcut**
- The learner uploads exercices, AI answers diligently.
- The learn copies answer, mistakes stay hidden.
- The parent sees finished homework but not understanding.
- The learner becomes more dependent over time.

Right card 1.2: **When AI becomes a coach**
- The student is guided through steps, hints come before answers.
- Weak spots become visible and can be targetted.
- Practice is adapted to the learner.
- Adults can follow progress without hovering.

Demo: (side by side sequential comparison of classic AI vs banban)

--

Feature 2:

Title: **Organized workspace - useful everyday, improving with time.**

Card 2.1: **A tutor and a companion.**
When students upload their work, banban uses the most pedagogical approach to guide them in an encouraging way. Hints, reminders, and analogies to scaffold the student's mental models and build lasting understanding.

Card 2.2: **Macro view - enabled.**
Homework is organized by subject, and entire course curricula can be uploaded so the student and banban has access the previous and following units at all times.

Card 2.3: **Ace the exams.**
Generate worksheets and quizzes, banban will keep track of the tough points. Next step: aim and destroy! By focusing on those pesky concepts, the student tame them one by one and boost their grades.

--

Feature 3:

Title: **Long-term support with banban's BigBrain**

Card 3.1: **banban learns about the student.**
Through wins and failures, with each astucious turn of phrase and each clumsy wording, banban perceives the students strengths and weaknesses. Secured in its BigBrain, those memories can be leveraged to design personalized practice.

Card 3.2: **Not only exams!**
The "test and forget" effect is real. Through daily drills and scheduled reminders through the weeks and months, banban allows hard-earn knowledge to stick. The student can save time and avoid te frustrating experience of relearning something from scractch every year.


Card 3.3: **Mastery for anything, anytime.**
Time to work on essay skills? banban remembers where the student's prose could use some polish. Need to brush on chemistry ? banban knows exactly which unit conversion they stumbled on during the last exam.

--

Feature 4:

Title: **Learning modes - Beyond cram & drill.**

Card 4.1: **Maps of knowledge**.
With the Maps mode, discuss the high-level meaning and goals of the current chapter. Go beyond mechanical practice and elevate your grasp of the topcis. Knowledge is build through connections and banban links the students interests with the schoolwork. Diagrams and infographics create lasting impressions and aid revisions.

Card 4.2: **Forward!**
Mastered the exam? Want to preview what's coming up during the holidays? When you use the Forward! mode, banban extend the student's skills and applies them to the next units so that they are never lost studying new topics in class.

Card 4.3: **Let curiosity guide learning.**
Stoke the flamme. In the Explore mode, the student is free to ask about black hole collisions, Marco Polo's .


### Tutor
(placeholder)

## -


## Calls To Action


## Mobile And Tablet Requirements


## Open Questions
