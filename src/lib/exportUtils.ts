import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TeamStats {
  id: string;
  name: string;
  rank: number;
  votes: number;
  teamName: string;
  totalVotes: number;
}

interface CompetitionStats {
  competitionName: string;
  totalTeams: number;
  totalRounds: number;
  totalVotes: number;
  avgVotesPerRound: number;
  mostPopularMeme?: TeamStats;
  overallLeaderboard: TeamStats[];
}

export function exportToCSV(stats: CompetitionStats, roomCode: string) {
  let csv = "Team Name,Total Votes,Rank\n";
  stats.overallLeaderboard.forEach((team: TeamStats, index: number) => {
    csv += `"${team.teamName}",${team.totalVotes},${index + 1}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `MemeWar_${roomCode}_Analytics.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(stats: CompetitionStats, roomCode: string) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text(`AI Meme War - ${stats.competitionName}`, 14, 20);

  doc.setFontSize(12);
  doc.text(`Room Code: ${roomCode}`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

  doc.text(`Total Teams: ${stats.totalTeams}`, 14, 50);
  doc.text(`Total Rounds: ${stats.totalRounds}`, 14, 58);
  doc.text(`Total Votes: ${stats.totalVotes}`, 14, 66);
  doc.text(`Avg Votes Per Round: ${stats.avgVotesPerRound}`, 14, 74);

  if (stats.mostPopularMeme) {
    doc.text(`Most Popular Meme: By ${stats.mostPopularMeme.teamName} (${stats.mostPopularMeme.votes} votes)`, 14, 86);
  }

  const tableData = stats.overallLeaderboard.map((t: TeamStats, idx: number) => [
    idx + 1,
    t.teamName,
    t.totalVotes
  ]);

  autoTable(doc, {
    startY: 100,
    head: [["Rank", "Team Name", "Total Votes"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [236, 72, 153] } // Pink-500
  });

  doc.save(`MemeWar_${roomCode}_Report.pdf`);
}
