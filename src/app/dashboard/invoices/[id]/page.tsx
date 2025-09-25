"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export default function InvoiceDetails() {
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
  const params = useParams<{ id: string }>()
  const invoiceId = params?.id as string | undefined
  
  const invoiceNumber = searchParams.get('number') || 'Unknown'

  useEffect(() => {
    const fetchInvoiceItems = async () => {
      try {
        if (!invoiceId) {
          setError('Missing invoice ID')
          return
        }
        console.log(`Fetching invoice items for invoice ID: ${invoiceId}`);
        const itemsResponse = await fetch(`/api/invoice-items/${invoiceId}`)
        
        console.log("API response status:", itemsResponse.status);
        const itemsData = await itemsResponse.json()
        console.log("API response data:", itemsData);
        
        if (!itemsResponse.ok) {
          console.error("Error fetching invoice items:", {
            status: itemsResponse.status,
            statusText: itemsResponse.statusText,
            data: itemsData
          });
          // Let's add more detailed error information
          const errorMessage = itemsData?.error || itemsData?.message || itemsResponse.statusText || "Unknown error";
          const errorDetails = itemsData?.details || "";
          const errorCode = itemsData?.code || "";
          setError(`Error loading invoice items: ${errorMessage} (Status: ${itemsResponse.status}). Details: ${errorDetails}. Code: ${errorCode}`);
          return;
        }
        
        setItems(itemsData)
        setError(null)
      } catch (err) {
        console.error("Error in fetchInvoiceItems:", err);
        setError('Failed to load invoice details')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoiceItems()
  }, [invoiceId])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Invoice Details - {invoiceNumber}</h1>
      
      {items.length === 0 ? (
        <p>No items found for this invoice.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.unit_price?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.total?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
