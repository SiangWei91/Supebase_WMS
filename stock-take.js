import { supabase } from './supabase-client.js';

export async function loadStockTakeData() {
  const tbody = document.getElementById('stock-take-table-body');
  if (!tbody) {
    console.error("Stock take table body not found.");
    return;
  }

  tbody.innerHTML = `<tr><td colspan="10" class="text-center">Loading data...</td></tr>`;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session.access_token;

    const response = await fetch('https://xnwjvhbkzrazluihnzhw.supabase.co/functions/v1/get-sheet-data', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.CR2) {
      throw new Error("CR2 data not found in the response.");
    }

    const cr2Data = data.CR2.slice(0, 10);

    tbody.innerHTML = '';

    if (cr2Data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center">No data found.</td></tr>`;
      return;
    }

    cr2Data.forEach(row => {
      const tr = document.createElement('tr');
      for (let i = 0; i < 10; i++) {
        const td = document.createElement('td');
        td.textContent = row[i] || '';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Failed to load stock take data:', error);
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Error loading data: ${error.message}</td></tr>`;
  }
}
