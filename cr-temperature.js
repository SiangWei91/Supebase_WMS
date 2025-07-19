import { supabase } from "./supabase-client.js";

const dateFilter = document.getElementById("date-filter");
const tabNav = document.getElementById("cr-temperature-tab-nav");
const tabContent = document.getElementById("cr-temperature-tab-content");

let data = [];
let chart = null;

async function fetchData() {
  try {
    const { data: fetchedData, error } = await supabase.functions.invoke(
      "get-coldroom-data"
    );

    if (error) {
      throw error;
    }

    data = fetchedData.data;
    dateFilter.value = new Date().toISOString().split("T")[0];
    createTabs();
    renderContent();
  } catch (error) {
    console.error("Error fetching data:", error);
    tabContent.innerHTML = `<p>Error loading data.</p>`;
  }
}

function createTabs() {
  const coldrooms = [...new Set(data.map((item) => item.Coldroom))];
  coldrooms.forEach((coldroom, index) => {
    const tab = document.createElement("button");
    tab.className = "tab-link";
    tab.textContent = coldroom;
    tab.dataset.coldroom = coldroom;
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

  const selectedColdroom = activeTab.dataset.coldroom;
  const selectedDate = dateFilter.value;

  const filteredData = data.filter((item) => {
    const parts = item.Date.split('/');
    const itemDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const itemDateString = itemDate.toISOString().split("T")[0];

    return item.Coldroom === selectedColdroom && itemDateString === selectedDate;
  });

  tabContent.innerHTML = "";

  const tableContainer = document.createElement("div");
  tableContainer.className = "cr-temperature-table-container";
  const table = document.createElement("table");
  table.className = "cr-temperature-table";
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
      ${filteredData
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
  tableContainer.appendChild(table);

  const chartContainer = document.createElement("div");
  chartContainer.className = "cr-temperature-chart-container";
  const canvas = document.createElement("canvas");
  chartContainer.appendChild(canvas);

  tabContent.appendChild(tableContainer);
  tabContent.appendChild(chartContainer);

  renderChart(canvas, filteredData);
}

function renderChart(canvas, chartData) {
  if (chart) {
    chart.destroy();
  }

  const labels = chartData.map((item) => item.Time);
  const temperatures = chartData.map((item) => item.Temperature);

  chart = new Chart(canvas, {
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
}

dateFilter.addEventListener("change", renderContent);

fetchData();
