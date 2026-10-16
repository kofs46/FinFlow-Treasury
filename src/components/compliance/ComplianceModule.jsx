import React, { useState } from 'react';
import { 
  Download, 
  Receipt, 
  CheckCircle2 
} from 'lucide-react';
import { 
  generateMushak63InvoicePDF, 
  generateTDSVDSSummaryPDF 
} from '../../services/reportExportService';

export default function ComplianceModule() {
  const [activeTab, setActiveTab] = useState('tax');

  const [deductionsList] = useState([
    {
      date: '2026-10-12',
      vendor: 'Bangla Host Cloud Services',
      binTIN: '493829182371',
      section: 'Sec 52AA (IT Enabled Service)',
      grossAmount: 85000,
      tdsRate: 5,
      tdsDeducted: 4250,
      vdsRate: 5,
      vdsDeducted: 4250
    },
    {
      date: '2026-10-08',
      vendor: 'Prime Security Logistics',
      binTIN: '893726152431',
      section: 'Sec 52 (Security Supply)',
      grossAmount: 120000,
      tdsRate: 10,
      tdsDeducted: 12000,
      vdsRate: 10,
      vdsDeducted: 12000
    },
    {
      date: '2026-10-02',
      vendor: 'Creative Media Ads Agency',
      binTIN: '772918291029',
      section: 'Sec 52 (Advertising Agency)',
      grossAmount: 250000,
      tdsRate: 4,
      tdsDeducted: 10000,
      vdsRate: 15,
      vdsDeducted: 37500
    }
  ]);

  const [mushakForm, setMushakForm] = useState({
    buyerName: 'Dhaka Tech Solutions Ltd.',
    buyerBIN: '003928172-0102',
    buyerAddress: 'Banani C/A, Dhaka-1213',
    serviceDesc: 'Enterprise Treasury ERP & Liquidity License',
    qty: 1,
    unitPrice: 120000,
    vatRate: 15
  });

  const handleDownloadMushak = (e) => {
    e.preventDefault();
    generateMushak63InvoicePDF({
      buyerName: mushakForm.buyerName,
      buyerBIN: mushakForm.buyerBIN,
      buyerAddress: mushakForm.buyerAddress,
      items: [
        {
          name: mushakForm.serviceDesc,
          qty: Number(mushakForm.qty),
          unitPrice: Number(mushakForm.unitPrice),
          sdRate: 0,
          vatRate: Number(mushakForm.vatRate)
        }
      ]
    });
  };

  const handleDownloadTDSVDS = () => {
    generateTDSVDSSummaryPDF({
      companyName: 'FinFlow Treasury Enterprise Ltd.',
      taxYear: '2026-2027',
      taxPeriod: 'Q3 Audit (Jul-Sep)',
      deductions: deductionsList
    });
  };

  const totalTDS = deductionsList.reduce((acc, curr) => acc + curr.tdsDeducted, 0);
  const totalVDS = deductionsList.reduce((acc, curr) => acc + curr.vdsDeducted, 0);

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* Header Bar */}
      <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E11D48] text-[10px] font-black uppercase tracking-wider border border-rose-200">
              NBR Regulatory Compliance
            </span>
            <span className="text-xs font-bold text-slate-400">
              • Bangladesh Tax & VAT Act 2012
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Audit, Tax & Compliance Helper
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Generate official Mushak 6.3 VAT invoices & TDS/VDS withholding tax sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTDSVDS}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download TDS/VDS Sheet</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('tax')}
          className={`py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'tax'
              ? 'bg-[#E11D48] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          TDS & VDS Ledger
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mushak')}
          className={`py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'mushak'
              ? 'bg-[#E11D48] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Mushak 6.3 Generator
        </button>
      </div>

      {/* 1. TDS & VDS TAB */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total TDS Withheld (Income Tax)</span>
              <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                Tk {totalTDS.toLocaleString()}
              </p>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 block">Depositable under Section 52</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total VDS Withheld (VAT Authority)</span>
              <p className="text-2xl font-black font-mono text-[#E11D48] mt-1">
                Tk {totalVDS.toLocaleString()}
              </p>
              <span className="text-[10px] font-bold text-rose-600 mt-1 block">To be deposited via Treasury Challan</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#F3D7D9] shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Audit Status</span>
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-black text-slate-800">100% Audit Ready</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">Compliant with NBR Tax Rules 2026</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#F3D7D9] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Withholding Tax Schedule</h3>
              <span className="text-[10px] font-mono text-slate-400">3 Verified Vendor Audits</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payee / Vendor</th>
                    <th className="py-3 px-4">TIN / BIN</th>
                    <th className="py-3 px-4">NBR Section</th>
                    <th className="py-3 px-4 text-right">Gross Bill</th>
                    <th className="py-3 px-4 text-right">TDS (Tax)</th>
                    <th className="py-3 px-4 text-right">VDS (VAT)</th>
                    <th className="py-3 px-4 text-right">Net Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {deductionsList.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{d.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{d.vendor}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{d.binTIN}</td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">{d.section}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">Tk {d.grossAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">Tk {d.tdsDeducted.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#E11D48]">Tk {d.vdsDeducted.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        Tk {(d.grossAmount - d.tdsDeducted - d.vdsDeducted).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MUSHAK 6.3 GENERATOR TAB */}
      {activeTab === 'mushak' && (
        <div className="rounded-3xl bg-white border border-[#F3D7D9] p-6 shadow-xs max-w-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Issue Mushak 6.3 Tax Invoice</h3>
              <p className="text-xs text-slate-400">Generates government formatted VAT Challan with BIN & Calculations</p>
            </div>
          </div>

          <form onSubmit={handleDownloadMushak} className="space-y-4 mt-5">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1.5">
                Buyer / Client Name
              </label>
              <input
                type="text"
                required
                value={mushakForm.buyerName}
                onChange={(e) => setMushakForm({ ...mushakForm, buyerName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1.5">
                  Buyer BIN (12 Digits)
                </label>
                <input
                  type="text"
                  required
                  value={mushakForm.buyerBIN}
                  onChange={(e) => setMushakForm({ ...mushakForm, buyerBIN: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1.5">
                  VAT Rate (%)
                </label>
                <select
                  value={mushakForm.vatRate}
                  onChange={(e) => setMushakForm({ ...mushakForm, vatRate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value={15}>15% (Standard Rate)</option>
                  <option value={10}>10% (Reduced Rate)</option>
                  <option value={7.5}>7.5% (Specific Services)</option>
                  <option value={5}>5% (Basic Supplies)</option>
                  <option value={0}>0% (Exempted)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1.5">
                Service / Item Description
              </label>
              <input
                type="text"
                required
                value={mushakForm.serviceDesc}
                onChange={(e) => setMushakForm({ ...mushakForm, serviceDesc: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1.5">
                Price Before VAT (BDT)
              </label>
              <input
                type="number"
                required
                min="1"
                value={mushakForm.unitPrice}
                onChange={(e) => setMushakForm({ ...mushakForm, unitPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E11D48]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="py-3 px-6 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Generate Mushak 6.3 PDF</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}