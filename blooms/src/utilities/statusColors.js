export function statusClasses(status) {
    switch (status) {
      case "learning":
        return {
          badge: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
          border: "border-yellow-300",
        };
        case "new":
            return {
              badge: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
              border: "border-yellow-300",
            };
      case "mastered":
        return {
          badge: "bg-green-100 text-green-800 ring-1 ring-green-300",
          border: "border-green-300",
        };
      case "forgotten":
        return {
          badge: "bg-red-100 text-red-800 ring-1 ring-red-300",
          border: "border-red-300",
        };
      default:
        return {
          badge: "bg-gray-100 text-gray-700 ring-1 ring-gray-300",
          border: "border-gray-200",
        };
    }
  }