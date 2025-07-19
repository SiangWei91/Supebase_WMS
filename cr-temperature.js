import { supabase } from "./supabase-client.js";

const dateFilter = document.getElementById("date-filter");
const dateDisplay = document.getElementById("date-display");
const tabNav = document.getElementById("cr-temperature-tab-nav");
const tabContent = document.getElementById("cr-temperature-tab-content");

let data = [];
let charts = [];

const coldroomGroups = {
  "Coldroom 5": ["Coldroom 5 - 1", "Coldroom 5 - 2"],
  "Coldroom 6": ["Coldroom 6", "Coldroom 6 Chiller"],
  "Blk 15": ["Blk 15", "Blk 15 Chiller"],
};

const coldroomNameMap = {
  "Coldroom 5c Chiller": "Coldroom 5c",
  "Coldroom 3B Chiller": "Coldroom 3B",
  "Coldroom 3A Chiller": "Coldroom 3A",
};

async function fetchData() {
  try {
    const { data: fetchedData, error } = await supabase.functions.invoke(
      "get-coldroom-data"
    );

    if (error) {
      throw error;
    }

    data = fetchedData.data.map((item) => ({
      ...item,
      Coldroom: coldroomNameMap[item.Coldroom] || item.Coldroom,
    }));

    dateFilter.value = new Date().toISOString().split("T")[0];
    updateDateDisplay();
    createTabs();
    renderContent();
  } catch (error) {
    console.error("Error fetching data:", error);
    tabContent.innerHTML = `<p>Error loading data.</p>`;
  }
}

function createTabs() {
  const allColdrooms = [...new Set(data.map((item) => item.Coldroom))];
  const groupedColdrooms = Object.values(coldroomGroups).flat();
  const singleColdrooms = allColdrooms.filter(
    (c) => !groupedColdrooms.includes(c)
  );
  const tabNames = [...Object.keys(coldroomGroups), ...singleColdrooms];

  tabNames.forEach((tabName, index) => {
    const tab = document.createElement("button");
    tab.className = "tab";
    tab.textContent = tabName;
    tab.dataset.tabName = tabName;
    if (index === 0) {
      tab.classList.add("active");
    }
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-link").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderContent();
    });
    tabNav.appendChild(tab);
  });
}

function renderContent() {
  const activeTab = document.querySelector(".tab-link.active");
  if (!activeTab) return;

  const selectedTabName = activeTab.dataset.tabName;
  const coldroomsToDisplay = coldroomGroups[selectedTabName] || [selectedTabName];

  tabContent.innerHTML = "";

  coldroomsToDisplay.forEach((coldroom) => {
    const groupContainer = document.createElement("div");
    groupContainer.className = "cr-temperature-group";

    const filteredData = data.filter((item) => {
      const parts = item.Date.split('/');
      const itemDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      const itemDateString = itemDate.toISOString().split("T")[0];
      return item.Coldroom === coldroom && itemDateString === dateFilter.value;
    });

    const tableContainer = createTable(filteredData, coldroom);
    const chartContainer = createChart(filteredData, coldroom);

    groupContainer.appendChild(tableContainer);
    groupContainer.appendChild(chartContainer);
    tabContent.appendChild(groupContainer);
  });
}

function createTable(tableData, coldroomName) {
  const container = document.createElement("div");
  container.className = "cr-temperature-table-container";
  const title = document.createElement("h3");
  title.textContent = coldroomName;
  container.appendChild(title);

  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Time</th>
        <th>Temperature</th>
        <th>Check By</th>
        <th>Remark</th>
      </tr>
    </thead>
    <tbody>
      ${tableData
        .map(
          (item) => `
        <tr>
          <td>${item.Time}</td>
          <td>${item.Temperature}</td>
          <td>${item["Check By"]}</td>
          <td>${item.Remark}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;
  container.appendChild(table);
  return container;
}

function createChart(chartData, coldroomName) {
  const container = document.createElement("div");
  container.className = "cr-temperature-chart-container";
  const title = document.createElement("h3");
  title.textContent = `${coldroomName} - Chart`;
  container.appendChild(title);

  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  const labels = chartData.map((item) => item.Time);
  const temperatures = chartData.map((item) => item.Temperature);

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature",
          data: temperatures,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    },
  });
  charts.push(chart);
  return container;
}

function updateDateDisplay() {
  const date = new Date(dateFilter.value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  dateDisplay.textContent = `${day}/${month}/${year}`;
}

dateFilter.addEventListener("change", () => {
  charts.forEach((c) => c.destroy());
  charts = [];
  updateDateDisplay();
  renderContent();
});

fetchData();
