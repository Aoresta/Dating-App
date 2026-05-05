const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const portrait = `${basePath}/member-placeholder.svg`;

// To use real photos:
// 1. Put images in public/members/
// 2. Change any member's image field to `${basePath}/members/file-name.jpg`
// 3. Keep file names lowercase and avoid spaces for easiest deployment.

export const parties = {
  ruling: {
    name: "Ruling Party",
    shortName: "Government",
    href: "/ruling-party",
    color: "#c9972b",
    dark: "#5b4216",
    intro:
      "The ruling party leads the mock government, introduces bills, answers questions, and carries responsibility for policy decisions.",
    quote: "Serve the House, serve the people."
  },
  opposition: {
    name: "Opposition Party",
    shortName: "Opposition",
    href: "/opposition",
    color: "#1f6f55",
    dark: "#143e35",
    intro:
      "The opposition examines every decision, asks hard questions, and offers alternative policy ideas with discipline and respect.",
    quote: "Question with courage, debate with dignity."
  },
  media: {
    name: "Media",
    shortName: "Press Gallery",
    href: "/media",
    color: "#8d1f2d",
    dark: "#3d1018",
    intro:
      "The media desk documents the event, prepares briefings, interviews members, and presents the public record of the session.",
    quote: "Record truthfully, report responsibly."
  },
  table: {
    name: "Table Officer & Speaker",
    shortName: "Secretariat",
    href: "/table-officer",
    color: "#315b96",
    dark: "#172c52",
    intro:
      "The Speaker and table officers keep procedure fair, maintain order, record decisions, and support the working of the House.",
    quote: "Procedure gives debate its power."
  }
};

const ideologies = [
  "Either Go Har(d) or Go Home",
  "Lead with service, not noise",
  "Policy first, popularity second",
  "Discipline turns debate into action",
  "Speak with facts and listen with respect"
];

export const rulingMembers = [
  "Prime Minister",
  "Finance Minister",
  "Home Minister",
  "Education Minister",
  "Health Minister",
  "Environment Minister",
  "Law Minister",
  "Transport Minister",
  "Agriculture Minister",
  "Digital Affairs Minister",
  "Youth Affairs Minister",
  "Women and Child Development Minister",
  "Sports Minister",
  "Culture Minister",
  "Rural Development Minister",
  "Urban Development Minister",
  "Science and Technology Minister",
  "Labour Minister",
  "Food Minister",
  "Parliamentary Affairs Minister"
].map((role, index) => member(`Minister ${index + 1}`, role, "ruling", index));

export const oppositionMembers = [
  "Leader of Opposition",
  "Deputy Leader of Opposition",
  "Shadow Finance Minister",
  "Shadow Home Minister",
  "Shadow Education Minister",
  "Shadow Health Minister",
  "Shadow Environment Minister",
  "Shadow Law Minister",
  "Shadow Transport Minister",
  "Shadow Agriculture Minister",
  "Shadow Digital Affairs Minister",
  "Shadow Youth Affairs Minister",
  "Shadow Sports Minister",
  "Shadow Culture Minister",
  "Shadow Rural Development Minister",
  "Shadow Urban Development Minister",
  "Shadow Science Minister",
  "Shadow Labour Minister",
  "Opposition Whip",
  "Policy Research Lead"
].map((role, index) => member(`Opposition Member ${index + 1}`, role, "opposition", index));

export const mediaMembers = [
  "Media Convenor",
  "Press Briefing Lead",
  "Photography Lead",
  "Video Coverage Lead",
  "Social Media Editor",
  "Interview Desk",
  "Event Report Writer"
].map((role, index) => member(`Media Member ${index + 1}`, role, "media", index));

export const tableOfficerMembers = [
  member("Hon. Speaker", "Speaker of the House", "table", 0),
  ...[
    "Chief Table Officer",
    "Roll Call Officer",
    "Question Hour Officer",
    "Motion Register Officer",
    "Voting Count Officer",
    "Timekeeping Officer",
    "Order Paper Officer"
  ].map((role, index) => member(`Table Officer ${index + 1}`, role, "table", index + 1))
];

export const gallery = [
  ["Opening Session", "Oath, welcome address, and the first sitting of the House."],
  ["Question Hour", "Members question ministers on student-focused public issues."],
  ["Bill Debate", "Arguments, amendments, and voting during formal debate."],
  ["Media Briefing", "Party leaders answer questions from the press gallery."],
  ["Table Office", "Agenda, timekeeping, roll call, and voting records in action."],
  ["Closing Ceremony", "Awards, certificates, and reflections from the assembly."]
];

export const counts = [
  ["Speaker", "1"],
  ["Table Officers", "6-7"],
  ["Ruling Party", "20"],
  ["Opposition", "20"],
  ["Media", "6-7"]
];

function member(name, role, partyKey, index) {
  return {
    name,
    role,
    partyKey,
    image: portrait,
    ideology: ideologies[index % ideologies.length]
  };
}
