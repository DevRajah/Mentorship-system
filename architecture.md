# Mentorship Pairing System Architecture

```mermaid
flowchart TD

%% =======================
%% FRONTEND LAYER
%% =======================
A[Frontend UI] -->|Upload Mentors| B[POST /api/mentors]
A -->|Upload Mentees| C[POST /api/mentees]
A -->|Click Pair (by stack)| D[POST /api/pairings/run?stack=...]
A -->|View Pairings| E[GET /api/pairings?stack=...]

%% =======================
%% CONTROLLERS
%% =======================
B --> F[Mentor Controller]
C --> G[Mentee Controller]
D --> H[Pairing Controller]
E --> H

%% =======================
%% DATABASE
%% =======================
F --> I[(Mentors Collection)]
G --> J[(Mentees Collection)]
H --> K[(Pairings Collection)]

%% =======================
%% PAIRING ENGINE FLOW
%% =======================
H --> L[Filter by stack]
L --> M[Fetch mentors]
L --> N[Fetch mentees]
L --> O[Fetch existing pairings]

M --> P[Build mentor count map]
N --> Q[Find unpaired mentees]
O --> P
O --> Q

%% =======================
%% FAIR DISTRIBUTION LOGIC
%% =======================
P --> R{Mentors with 0 mentees?}
R -->|Yes| S[Randomly select mentor (0 mentees)]
R -->|No| T{Mentors with 1 mentee?}

T -->|Yes| U[Randomly select mentor (1 mentee)]
T -->|No| V[Stop: All mentors full]

%% =======================
%% ASSIGNMENT
%% =======================
S --> W{Unpaired mentee exists?}
U --> W

W -->|No| X[Stop: No mentees left]
W -->|Yes| Y[Create pairing]

Y --> K
Y --> Z[Update mentor.mentees array]

Z --> I

%% =======================
%% RESPONSE FLOW
%% =======================
Y --> AA[Return mentor + mentee]
AA --> A

%% =======================
%% VIEW PAIRINGS
%% =======================
E --> AB[Group by mentor]
AB --> AC[Attach mentor email + mentee count]
AC --> AD[Return structured response]
AD --> A
```