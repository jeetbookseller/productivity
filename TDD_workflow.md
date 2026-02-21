---
name: tdd-workflow
description: >
  Enforces a structured Test-Driven Development (TDD) workflow for any development task across
  web/frontend (HTML, React, JS), embedded systems (C/C++), and Python. Use this skill whenever
  the user asks to implement a feature, fix a bug, refactor code, or build anything that involves
  writing or changing code. Triggers on requests like "add X feature", "implement Y", "build Z",
  "fix this bug", "create a script/component/module", or any coding task. Always use this skill
  before writing a single line of implementation code — the plan-first, test-first approach is
  the whole point. Even if the user just says "let's code" or "can you help me build something",
  start here.
---

# TDD Workflow Skill

A disciplined, 5-phase workflow: Plan → Buy-In → Test First → Develop → Document.
Never skip phases. Never write implementation before tests. Never close a task without updating docs.

---

## Phase 1: PLAN — Build the To Do List

Before anything else, decompose the request into a clear, numbered task list.

**Format:**
```
## To Do: [Feature/Task Name]

- [ ] 1. [Specific, actionable task]
- [ ] 2. [Specific, actionable task]
- [ ] 3. ...

**Affected files:** list files that will be created or modified
**Test approach:** executable unit tests | behavior checklist | both (state which and why)
**Doc target:** TASKS.md | README.md | [detected project doc]
```

**Rules:**
- Tasks must be atomic — one clear action each
- Order tasks so dependencies flow top to bottom
- Call out anything ambiguous and propose a resolution
- Identify the test approach based on context:
  - Use **executable tests** (pytest, Jest, Google Test, Unity) when a test runner is present or can be added
  - Use **behavior checklists** for UI behavior, embedded integration, or when a test runner isn't viable
  - Use **both** when the task has unit-testable logic AND observable behavior

---

## Phase 2: BUY-IN — Hard Stop

After presenting the To Do list, **stop completely** and ask:

> "Does this plan look right? Any changes before I start? I won't proceed until you confirm."

Do not write any code, tests, or files until the user explicitly approves. Approval can be:
- "Looks good", "yes", "go ahead", "approved", "LGTM", or equivalent
- Specific modifications ("change task 3 to X") — incorporate and re-confirm once

---

## Phase 3: TEST FIRST — Write Tests Before Implementation

For each task in the approved To Do list, write the tests **before** writing implementation.

### Executable Tests
- Name tests descriptively: `test_<what_it_does>_<expected_result>`
- Cover: happy path, edge cases, failure/error cases
- Place tests in the appropriate location for the project structure
- Tests must **fail** initially (red) — confirm this before moving to implementation

```python
# Example: Python
def test_calculate_total_returns_zero_for_empty_cart():
    assert calculate_total([]) == 0

def test_calculate_total_sums_item_prices():
    assert calculate_total([{"price": 10}, {"price": 5}]) == 15
```

```js
// Example: Jest
test('returns empty array when no items match filter', () => {
  expect(filterItems([], 'active')).toEqual([]);
});
```

```c
// Example: Unity (C embedded)
void test_crc16_known_value(void) {
    TEST_ASSERT_EQUAL_HEX16(0x29B1, crc16_compute(test_data, sizeof(test_data)));
}
```

### Behavior Checklists
When executable tests aren't appropriate, define a checklist of observable behaviors:
```
Test checklist for [task]:
- [ ] Behavior A occurs when condition X
- [ ] No regression on behavior B
- [ ] Error state C is handled gracefully
```

---

## Phase 4: DEVELOP — Implement Against Tests

With tests written and confirmed failing (or checklist defined), implement the code.

**Loop per task:**
1. Write minimal implementation to make tests pass
2. Run tests
3. If passing → mark task complete, move to next
4. If failing → fix and re-run (counts as attempt)

### Failure Escalation Rule
If tests are still failing after **3 attempts** on a single task:

1. **Stop** — do not attempt a 4th fix
2. **Flag** the failure clearly:
```
⚠️ BLOCKED: Task [N] — [task name]
Attempts: 3/3
Failing tests:
  - test_name: [actual vs expected]
  - test_name: [error message]
Root cause hypothesis: [best guess]
Options to proceed:
  A) [Suggested fix approach]
  B) [Alternative approach or scope change]
  C) Skip and document as known issue
How would you like to proceed?
```
3. **Document** the blockage in the project doc immediately (see Phase 5)
4. Wait for user direction before continuing

---

## Phase 5: DOCUMENT — Update the Project Doc

When all tasks are complete (or a session ends), update the project documentation.

### Locate or Create the Doc
- Look for: `TASKS.md`, `PROJECT.md`, `CHANGELOG.md`, `README.md` (tasks section)
- If none exists, create `TASKS.md` in the project root

### Required Updates

**1. Mark completed tasks:**
```markdown
- [x] 1. Task description — ✅ completed [date]
```

**2. Mark blocked tasks:**
```markdown
- [⚠️] 3. Task description — BLOCKED after 3 attempts
  - Failure: [brief description]
  - Documented: [date]
```

**3. Version bump** (if the project has versioning):
```markdown
## Version History
- v1.2.0 — [date]: Added [feature], fixed [bug]
```

**4. New guidance** (if anything non-obvious was learned):
```markdown
## Notes & Guidance
- When adding X, always Y because Z
- Known issue: [description] — workaround: [approach]
```

**5. Session summary** (brief, at the top of the doc or in a session log section):
```markdown
## Session [date]
- Completed: tasks 1, 2, 4
- Blocked: task 3 (see notes)
- Next: task 5 pending user decision on blocked item
```

---

## Quick Reference — Phase Checklist

| Phase | Action | Gate |
|-------|--------|------|
| 1. Plan | Generate numbered To Do list | — |
| 2. Buy-In | Present plan, hard stop | ✋ Explicit approval required |
| 3. Test First | Write all tests before implementation | Tests must exist before code |
| 4. Develop | Implement, run, fix (max 3 attempts) | All tests pass OR blocked & escalated |
| 5. Document | Update TASKS.md / project doc | Always — even for partial sessions |

---

## Edge Cases

**Tiny fix / one-liner:** Just fix it. No plan, no buy-in, no ceremony. Document the change in the project doc afterward.

**No existing test infrastructure:** Set up minimal test infrastructure as task #1 of the To Do list.

**Multiple features in one request:** Create one unified To Do list covering all of them. Get single buy-in.

**User says "just do it, skip the plan":** Acknowledge, but still present a brief To Do (even 2–3 lines) and confirm before writing code. The plan is a safety net for both parties.
