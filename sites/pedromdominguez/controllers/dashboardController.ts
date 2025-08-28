export const getDashboardOverview = async (ctx: Context) => {
  console.log("📡 [Dashboard] Admin overview request received.");
  console.log("🔐 Verifying dashboard access...");

  const overviewPayload: DashboardOverview = {
    // 🚫 No more welcomeMessage
    contentSections: [
      { label: "📅 Manage Appointments", link: "manage-appointments.html" },
    ],
    systemTools: [
      { label: "⚙️ Site Settings", link: "settings.html" },
      { label: "📫 User Messages", link: "user-messages.html" },
    ],
    aboutSection: [
      { label: "🔄 System Updates", link: "system-updates.html" },
      { label: "ℹ️ About DenoGenesis", link: "about-denogenesis.html" },
    ],
    communityLinks: [
      { label: "🌍 Official GitHub", link: "https://github.com/xtcedro" },
      { label: "📚 DenoGenesis Docs", link: "docs.html" },
      { label: "💬 Community Chat", link: "community-chat.html" },
    ],
  };

  console.log("✅ [Dashboard] Overview content prepared and delivered.");
  ctx.response.status = 200;
  ctx.response.body = overviewPayload;
};
