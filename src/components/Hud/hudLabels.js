export function statusLabel(status) {
  switch (status) {
    case "idle":
      return "AWAITING INPUT";
    case "loading":
      return "FETCHING IMAGE";
    case "detecting":
      return "ANALYZING PIXELS";
    case "done":
      return "SCAN COMPLETE";
    case "error":
      return "SCAN FAILED";
    default:
      return "";
  }
}
