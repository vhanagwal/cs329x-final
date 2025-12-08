# Presentation Script: Generative Interfaces for Personalized AI Collaboration
**Total Time: ~5 minutes**

---

## SLIDE 1: Title (30 seconds)

> "Hi everyone, I'm presenting **Generative Interfaces for Personalized AI Collaboration**.
>
> The core question driving this project is: **Can LLM-generated workspaces reduce cognitive load compared to traditional chat interfaces?**
>
> We use GPT-4o for generation, RAG for personalization, and LLM-as-Judge for evaluation—all in an A/B comparison framework."

---

## SLIDE 2: Introduction & Problem (30 seconds)

> "Here's the problem: Today's LLM interfaces are almost entirely **linear, text-based chat**.
>
> Users have to maintain mental models of their goals, track revisions, and manage task states—all in their heads. There's no spatial structure, even though human cognition thrives on it.
>
> Our approach is **GenUI**: instead of forcing users to think *through* a chat interface, we let GPT-4 generate **structured workspace layouts**—panels, boards, timelines—that externalize reasoning and match the user's cognitive style.
>
> Our research question: Can these generative, personalized interfaces help users complete complex tasks more effectively than chat?"

---

## SLIDE 3: Related Work (30 seconds)

> "We build on several lines of prior work:
>
> **Chen et al.'s work on Generative Interfaces** showed LLMs can act as interface co-designers. We extend this by making cognitive offloading an explicit design target.
>
> **Lewis et al.'s RAG** is typically used for factuality—we apply it for *personalization*.
>
> We also draw on **NASA-TLX** for workload assessment, **Nielsen's usability heuristics**, and **Gilardi et al.'s LLM-as-Judge** validation work.
>
> Our contribution is the first system combining **prompt-driven UI generation + RAG personalization + rubric-based LLM evaluation** in a single pipeline."

---

## SLIDE 4: Data (30 seconds)

> "For data, we created **synthetic datasets** to scaffold the generation process:
>
> - **3 personas** based on cognitive style literature—VisualWriter, LinearWriter, and ResearchWriter
> - **8 task exemplars** for few-shot prompting
> - **7 UI patterns** inspired by the RICO dataset
> - **4 behavior traces** modeled after ScholaWrite keystroke data
>
> Why synthetic? There's no public dataset of task-to-optimal-UI mappings. Our synthetic personas capture the *ecology of cognition*—linking reasoning styles to interface patterns—which enables systematic RAG personalization. This serves as feasibility evidence before user studies."

---

## SLIDE 5: Methods Part 1 - Architecture (30 seconds)

> "Here's our system architecture—a 3-module pipeline:
>
> 1. **User input**: persona selection, goal description, and task intent
> 2. **RAG module**: retrieves relevant persona context, UI patterns, task exemplars, and behavior traces
> 3. **GPT-4o**: generates a structured UI specification in JSON
> 4. **LLM Judge**: evaluates the generated UI on a 5-factor rubric
> 5. **React renderer**: dynamically renders the workspace
>
> The component grammar includes **layout primitives**—rows, columns, splits—and **widgets** like editor, outline, kanban, chat, mindmap, stats, research panel, timeline, and critique view."

---

## SLIDE 6: Methods Part 2 - Implementation (30 seconds)

> "Implementation details: We use **Next.js 14** with React and TypeScript. GPT-4o with JSON mode ensures structured outputs, and **Zod** provides runtime schema validation.
>
> The prompt engineering is crucial: we inject the user's persona, cognitive style, and preferences, along with RAG-retrieved context—exemplars, patterns, and traces—plus design rules from Nielsen and cognitive load theory.
>
> Key design decisions: We chose **few-shot prompting over fine-tuning** for interpretability. The recursive schema allows arbitrary layout depth. We use temperature 0.7 for generation and 0.3 for evaluation."

---

## SLIDE 7: Results Part 1 - Evaluation Framework (30 seconds)

> "For evaluation, we designed a **5-factor rubric** using LLM-as-Judge:
>
> - **Cognitive Load** (25%)—based on NASA-TLX
> - **Clarity** (20%)—based on Nielsen
> - **Efficiency** (20%)—based on Nielsen
> - **Personalization** (20%)—user modeling fit
> - **Aesthetics** (15%)—visual harmony
>
> We test across **3 conditions**:
> 1. **Baseline**: chat-only interface
> 2. **Generic GenUI**: generated UI without personalization
> 3. **Personalized GenUI**: generated UI with RAG context
>
> Our hypothesis: Personalized outperforms Generic outperforms Baseline on all factors."

---

## SLIDE 8: Results Part 2 - Quantitative Results (45 seconds)

> "Here are our quantitative results from GPT-4o evaluation.
>
> Looking at the chart, **Personalized GenUI** (purple) consistently outperforms both **Generic GenUI** (blue) and **Baseline Chat** (gray) across all five factors.
>
> The most dramatic difference is in **Personalization**—the personalized condition scores 85 versus just 33 for baseline, a **162% improvement**.
>
> Overall scores:
> - Baseline: **46.1**
> - Generic: **55.0**
> - Personalized: **71.0**
>
> That's a **54% improvement** from baseline to personalized, and a **29% improvement** from generic to personalized. This confirms that personalization via RAG provides meaningful benefit beyond just having a structured interface."

---

## SLIDE 9: Results Part 3 - Qualitative Findings (30 seconds)

> "Qualitatively, we see the system generating **distinct layouts for different personas**.
>
> For a **VisualWriter** brainstorming thesis ideas, GPT-4 generates a layout with **mindmap, kanban, and chat**—supporting divergent thinking and spatial organization.
>
> For a **LinearWriter** drafting a paper introduction, it generates **outline, editor, and stats**—supporting hierarchical structure and sequential drafting.
>
> The GPT rationales explicitly reference the retrieved persona traits—like 'branches ideas before drafting' or 'outline-first approach'. This shows the model is successfully using RAG context to personalize."

---

## SLIDE 10: Discussion & Conclusion (45 seconds)

> "To wrap up—our key takeaways:
>
> 1. **GenUI outperforms chat** on all 5 evaluation factors
> 2. **Personalization matters**: +162% on persona fit, +29% overall versus generic
> 3. **GPT-4 can act as an interface designer** given structured prompts and RAG context
> 4. **LLM-as-Judge enables scalable evaluation**
>
> **Limitations** to acknowledge:
> - Our personas are synthetic—real user behavior is richer and noisier
> - LLM judges may have bias and compress score ranges
> - Our sample size is small; we need N≥30 for statistical power
>
> **Future work** includes IRB-approved user studies, longitudinal adaptation that learns from interaction history, domain expansion beyond writing tasks, and accessibility audits.
>
> Our vision: **Generative interfaces as a new design grammar for AI**—turning invisible thought processes into visible, manipulable structures.
>
> Thank you! Happy to take questions."

---

## Q&A Preparation

**Potential questions and answers:**

1. **"Why synthetic data instead of real users?"**
   > "Two reasons: First, there's no public dataset of task-to-optimal-UI mappings. Second, synthetic data lets us systematically vary cognitive styles based on literature, giving us controlled comparisons. This is feasibility evidence—we plan user studies next."

2. **"How do you validate the LLM-as-Judge approach?"**
   > "Gilardi et al. 2023 showed GPT outperforms crowd workers on annotation tasks. We designed our rubric with established measures—NASA-TLX, Nielsen heuristics—to ground the evaluation. User studies will validate whether LLM scores correlate with human preferences."

3. **"What about hallucination or invalid UI specs?"**
   > "We use JSON mode and Zod schema validation. If parsing fails, we have fallback layouts. In practice, GPT-4o reliably generates valid specs with few-shot examples."

4. **"How does this scale to more complex tasks?"**
   > "The recursive schema allows arbitrary nesting. For complex tasks, the model can generate multi-panel, hierarchical layouts. The component grammar is extensible—we can add new widgets."

5. **"What about user agency—can users modify the generated UI?"**
   > "Currently it's one-shot generation. Future work includes co-adaptive interfaces where users can modify layouts and the system learns from those modifications."

---

## Timing Summary

| Slide | Topic | Time |
|-------|-------|------|
| 1 | Title | 0:30 |
| 2 | Introduction & Problem | 0:30 |
| 3 | Related Work | 0:30 |
| 4 | Data | 0:30 |
| 5 | Methods - Architecture | 0:30 |
| 6 | Methods - Implementation | 0:30 |
| 7 | Results - Evaluation Framework | 0:30 |
| 8 | Results - Quantitative | 0:45 |
| 9 | Results - Qualitative | 0:30 |
| 10 | Discussion & Conclusion | 0:45 |
| **Total** | | **~5:00** |

