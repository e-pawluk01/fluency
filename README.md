# Fluency

Times-table drills, 1–12. Pick the tables to mix, how many questions, and an optional per-question timer.

```bash
npm run dev     # http://localhost:3000
npm test        # question generator tests
```

The question order lives in `lib/questions.ts`. 7 × 8 and 8 × 7 are one fact; every fact in the mix comes up once before any repeats, a fact never returns within half the pool, and back-to-back questions avoid sharing an answer or being one step apart (7 × 3 → 7 × 4).

Settings are kept in the browser (localStorage). Add it to your phone's home screen to use it like an app.
