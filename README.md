# Mentorship Matching System

A backend platform designed to automate mentor–mentee pairing for educational programs.

## Impact

This system replaced a manual mentor assignment process previously conducted using paper and pen, improving efficiency and fairness in mentee distribution.

## Key Features
- Automated mentor–mentee pairing
- Stack-based matching (Frontend, Backend, Design)
- Availability-aware pairing
- Balanced mentor load (max two mentees per mentor)
- Cohort-based matching logic

## ⚙️ Architecture Overview

The system uses a fair, incremental pairing algorithm that:
- Assigns one mentee per request
- Ensures every mentor gets at least one mentee before any gets a second
- Uses randomized selection for fairness
- Maintains state in MongoDB for consistency

---

## 🏗️ System Architecture

# Mentorship Pairing System Architecture

```mermaid
flowchart TD

A[Frontend UI] -->|Upload Mentors| B[POST mentors API]
A -->|Upload Mentees| C[POST mentees API]
A -->|Click Pair| D[Run Pairing API]
A -->|View Pairings| E[Get Pairings API]

B --> F[Mentor Controller]
C --> G[Mentee Controller]
D --> H[Pairing Controller]
E --> H

F --> I[(Mentors Collection)]
G --> J[(Mentees Collection)]
H --> K[(Pairings Collection)]

H --> L[Filter by stack]
L --> M[Fetch mentors]
L --> N[Fetch mentees]
L --> O[Fetch existing pairings]

M --> P[Build mentor count map]
N --> Q[Find unpaired mentees]
O --> P
O --> Q

P --> R{Mentors with 0 mentees}
R -->|Yes| S[Select random mentor with 0]
R -->|No| T{Mentors with 1 mentee}

T -->|Yes| U[Select random mentor with 1]
T -->|No| V[Stop all mentors full]

S --> W{Unpaired mentee exists}
U --> W

W -->|No| X[Stop no mentees left]
W -->|Yes| Y[Create pairing]

Y --> K
Y --> Z[Update mentor mentees]

Z --> I

Y --> AA[Return pairing result]
AA --> A

E --> AB[Group pairings]
AB --> AC[Attach email and count]
AC --> AD[Return structured data]
AD --> A
```

---

## Matching Algorithm
``
The system pairs mentors and mentees using the following logic:

1. Retrieve mentees without mentors
2. Match them with mentors with the lowest mentee count
3. Ensure stack compatibility
4. Distribute mentees evenly
5. Repeat until all mentees are paired

## Real-world Usage

The system has been used in a mentorship program with:

- Over **70 mentees** per cohort
- Over **40 mentors** per cohort
- Multiple technical stacks

It significantly reduced manual coordination and pairing errors.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- REST APIs

## Future Improvements

- Admin dashboard
- Mentor availability tracking
- Matching analytics
- Cohort management
- Open-source matching module
