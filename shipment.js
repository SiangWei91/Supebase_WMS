export async function loadShipmentPage() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', async (event) => {
      await openTab(event, event.currentTarget.dataset.tab);
    });
  });

  // Load the shipment list by default
  const shipmentListTab = document.querySelector('[data-tab="shipment-list"]');
  if (shipmentListTab) {
    await openTab({ currentTarget: shipmentListTab }, 'shipment-list');
  }
}

async function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tab-content");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tab");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  if (tabName === 'shipment-list') {
    const shipmentListContainer = document.getElementById('shipment-list');
    shipmentListContainer.innerHTML = '<h2>Shipment List</h2><div id="shipment-list-table"></div>';
    const data = await getShipmentList();
    if (data) {
      const table = renderShipmentTable(data);
      document.getElementById('shipment-list-table').appendChild(table);
    }
  }
}

async function getShipmentList() {
  const { data, error } = await supabase.functions.invoke('shipment-list', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching shipment list:', error);
    return;
  }

  return data;
}

function renderShipmentTable(data) {
  const table = document.createElement('table');
  table.classList.add('shipment-table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = data.values[0];
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let i = 1; i < data.values.length; i++) {
    const rowData = data.values[i];
    const row = document.createElement('tr');
    rowData.forEach(cellData => {
      const td = document.createElement('td');
      td.textContent = cellData;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  return table;
}
