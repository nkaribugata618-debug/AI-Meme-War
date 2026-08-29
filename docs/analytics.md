# Analytics & Exports

The Analytics module provides the host with actionable insights and permanent records of the competition.

## Dashboard UI
- **Route**: `/host/[roomCode]/analytics`
- **Design**: Built strictly with Tailwind CSS and Framer Motion (no external charting libraries).
- **Metrics**: Total Teams, Total Rounds, Total Votes, Average Votes per Round, and the Most Popular Meme.

## Data Aggregation
The `/api/analytics` endpoint performs a deep Prisma query utilizing `include` directives and `_count` aggregation to calculate total votes across all submissions, efficiently sorting to determine the overall winners.

## Exporters
Located in `src/lib/exportUtils.ts`:
- **CSV Export**: Compiles team scores into a comma-separated format and leverages native browser `Blob` rendering for immediate download.
- **PDF Export**: Utilizes `jsPDF` and `jspdf-autotable` to generate a professional PDF report entirely on the client-side, avoiding heavy server constraints.
