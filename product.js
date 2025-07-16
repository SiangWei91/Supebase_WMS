import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const fetchProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
    if (error) {
        console.error('Error fetching products:', error)
        return []
    }
    return data
}

const createProductTable = (products) => {
    const table = document.createElement('table')
    table.classList.add('product-table')

    const thead = document.createElement('thead')
    thead.innerHTML = `
        <tr>
            <th>Item Code</th>
            <th>Product Name</th>
            <th>Chinese Name</th>
            <th>Packing Size</th>
        </tr>
    `
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    products.forEach(product => {
        const tr = document.createElement('tr')
        tr.innerHTML = `
            <td>${product.item_code}</td>
            <td>${product.product_name}</td>
            <td>${product.product_chinese_name || ''}</td>
            <td>${product.packing_size}</td>
        `
        tbody.appendChild(tr)
    })
    table.appendChild(tbody)

    return table
}

export const displayProducts = async () => {
    const products = await fetchProducts()
    const productTable = createProductTable(products)
    const content = document.getElementById('content')
    const h1 = document.createElement('h1')
    h1.innerText = 'Products'
    content.innerHTML = ''
    content.appendChild(h1)
    content.appendChild(productTable)
}
