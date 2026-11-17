"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Plus,
  Printer,
  Tag,
  User,
  X,
  Minus,
} from "lucide-react";
import {
  type OrderLineItem,
  type TableRecord,
  useDemoStore,
} from "@/context/DemoStoreProvider";
import {
  BotanicalSprig,
  SaboreaCanvasBackground,
  SaboreaLogo,
  TableStatusIcon,
} from "@/components/SaboreaGraphics";

function StatusDot({ status }: { status: TableRecord["status"] }) {
  const color =
    status === "Available"
      ? "bg-[#6B8E6B]"
      : status === "Preparing"
        ? "bg-[#C49A45]"
        : "bg-[#4A779D]";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function CashierPage() {
  const {
    tables,
    selectedTable,
    selectTable,
    markTableComplete,
    assignOrderToTable,
    menuItems,
    getLineTotal,
    getTableTotal,
  } = useDemoStore();

  const [printPreviewTable, setPrintPreviewTable] = useState<TableRecord | null>(null);
  const [assignModalTableId, setAssignModalTableId] = useState<string | null>(null);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const openAssignModal = (tableId: string) => {
    setAssignModalTableId(tableId);
    setDraftQuantities({ "classic-margherita": 1 });
  };

  const handleConfirmAssign = () => {
    if (!assignModalTableId) return;
    const lines: OrderLineItem[] = Object.entries(draftQuantities)
      .filter(([, q]) => q > 0)
      .map(([itemId, quantity]) => {
        const item = menuItems.find((m) => m.id === itemId);
        if (!item) return null;
        return {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity,
          image: item.image,
        };
      })
      .filter((x): x is OrderLineItem => x !== null);

    if (lines.length === 0) return;
    assignOrderToTable(assignModalTableId, lines);
    const tbl = tables.find((t) => t.id === assignModalTableId);
    setAssignModalTableId(null);
    showToast(`Order assigned to ${tbl?.number ?? "table"}`);
  };

  const handleCompleteTable = (table: TableRecord) => {
    markTableComplete(table.id);
    showToast(`${table.number} marked complete & cleared`);
  };

  const selectedTotal = getTableTotal(selectedTable);
  const assignTargetTable = tables.find((t) => t.id === assignModalTableId);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-16">
      <SaboreaCanvasBackground showTopLeaves={false} />

      <div className="relative z-10 mx-auto max-w-[1120px] px-4 sm:px-6 pt-4 pb-8">
        {/* Top Bar */}
        <header className="flex items-center justify-between gap-3 pb-4">
          <SaboreaLogo variant="horizontal" size="md" />

          <h1 className="font-serif font-semibold text-[28px] sm:text-[34px] text-[#231F1E] leading-none">
            Cashier
          </h1>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border border-[#BFA36F] bg-[#FDFBF7] flex items-center justify-center text-[#9E7A38]"
              title="Cashier Profile"
            >
              <User className="w-5 h-5 stroke-[1.6]" />
            </div>
            <span className="hidden sm:block w-px h-6 bg-[#DECBA4]" />
            <div className="rounded-full bg-[#F7F1E5] border border-[#E2D2B5] px-3.5 py-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-[#231F1E]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6B8E6B]" />
              <span className="hidden sm:inline">Service active</span>
              <span className="sm:hidden">Active</span>
            </div>
          </div>
        </header>

        {/* Two-Column POS Layout */}
        <div className="mt-1 grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-5 items-start">
          {/* Left Panel: Tables */}
          <section className="saborea-card rounded-[20px] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif font-semibold text-[24px] text-[#231F1E]">
                Tables
              </h2>

              <div className="flex items-center gap-4 text-[12.5px] text-[#4E4640]">
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot status="Available" />
                  Available
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot status="Preparing" />
                  Preparing
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot status="Ready" />
                  Ready
                </span>
              </div>
            </div>

            {/* 3x2 Grid of Tables */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tables.map((table) => {
                const isSelected = table.id === selectedTable.id;

                return (
                  <div
                    key={table.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectTable(table.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectTable(table.id);
                      }
                    }}
                    className={`rounded-[14px] p-4 bg-[#FDFBF7] transition flex flex-col justify-between min-h-[192px] cursor-pointer text-left ${
                      isSelected
                        ? "border-[2px] border-[#B58938] shadow-[0_4px_14px_rgba(181,137,56,0.16)]"
                        : "border border-[#E5D7BE] hover:border-[#C49A45]"
                    }`}
                  >
                    <div>
                      <TableStatusIcon status={table.status} />

                      <h3 className="mt-2.5 text-center font-serif font-semibold text-[21px] leading-tight text-[#231F1E]">
                        {table.number}
                      </h3>

                      <div className="mt-1 flex items-center justify-center gap-1.5 text-[12.5px] text-[#4E4640]">
                        <StatusDot status={table.status} />
                        <span>{table.status}</span>
                      </div>
                    </div>

                    {table.status === "Available" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectTable(table.id);
                          openAssignModal(table.id);
                        }}
                        className="mt-4 w-full rounded-[8px] border border-[#DECBA4] bg-[#FDFBF7] py-1.5 px-3 text-[12.5px] font-medium text-[#7D6231] hover:bg-[#F5EBD6] inline-flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign order</span>
                      </button>
                    ) : (
                      <div className="mt-3 pt-2.5 border-t border-[#EFE5D2] space-y-1">
                        {table.items.slice(0, 3).map((line) => (
                          <div
                            key={`${table.id}-${line.menuItemId}`}
                            className="flex items-center justify-between gap-2 text-[11.5px] text-[#3E3733]"
                          >
                            <span className="truncate">
                              {line.name} × {line.quantity}
                            </span>
                            <span className="shrink-0 font-medium text-[#231F1E]">
                              EGP {getLineTotal(line)}
                            </span>
                          </div>
                        ))}
                        {table.items.length > 3 && (
                          <p className="text-[11px] text-[#9E7A38]">
                            +{table.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Panel: Selected Table Order */}
          <aside className="saborea-card rounded-[20px] p-5 sm:p-6 relative overflow-hidden">
            {/* Header with subtle underline & botanical sprig */}
            <div className="relative pb-3 border-b border-[#E6D8BE]">
              <h2 className="font-serif font-semibold text-[25px] leading-tight text-[#231F1E]">
                {selectedTable.number} order
              </h2>
              <BotanicalSprig
                className="pointer-events-none absolute -top-2 -right-3 w-20 h-14 opacity-70"
                flip
              />
            </div>

            {selectedTable.items.length > 0 ? (
              <div>
                {/* Demo / Live Tag */}
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F7EFE0] border border-[#E5D7BE] px-2.5 py-0.5 text-[11px] font-medium text-[#6E655F]">
                    <Tag className="w-3 h-3 text-[#B58938]" />
                    {selectedTable.isDemo ? "Demo order" : "Active order"}
                  </span>
                </div>

                {/* Itemized Rows */}
                <div className="mt-3 divide-y divide-[#EFE5D2]">
                  {selectedTable.items.map((line) => (
                    <div
                      key={`${selectedTable.id}-detail-${line.menuItemId}`}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full border border-[#DECBA4] overflow-hidden bg-[#F3ECE0] shrink-0">
                          <img
                            src={line.image}
                            alt={line.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-serif text-[16px] text-[#231F1E] truncate">
                          {line.name} <span className="text-[#6E655F]">× {line.quantity}</span>
                        </span>
                      </div>

                      <span className="font-serif font-medium text-[16px] text-[#231F1E] shrink-0">
                        EGP {getLineTotal(line)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-[#E6D8BE] pt-4 mt-2 flex items-center justify-between">
                  <span className="font-serif font-medium text-[20px] text-[#231F1E]">
                    Total
                  </span>
                  <span className="font-serif font-semibold text-[22px] text-[#9E7A38]">
                    EGP {selectedTotal.toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintPreviewTable(selectedTable);
                      showToast(`Print preview ready for ${selectedTable.number}`);
                    }}
                    className="saborea-gold-btn w-full rounded-[12px] py-3 font-serif text-[18px] font-medium text-white flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompleteTable(selectedTable)}
                    className="w-full rounded-[12px] border border-[#C49A45] bg-[#FDFBF7] py-2.5 font-serif text-[17px] font-medium text-[#8B6A2B] hover:bg-[#F5EBD6] flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark table complete</span>
                  </button>
                </div>

                <p className="mt-3 text-center text-[11.5px] leading-relaxed text-[#6E655F]">
                  Completing the table will clear the order and make it available again.
                </p>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="font-serif text-[19px] text-[#231F1E]">
                  {selectedTable.number} is available
                </p>
                <p className="mt-1 text-[13px] text-[#6E655F]">
                  No active order assigned to this table yet.
                </p>
                <button
                  type="button"
                  onClick={() => openAssignModal(selectedTable.id)}
                  className="mt-5 saborea-gold-btn rounded-[12px] px-5 py-2.5 font-serif text-[16px] text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign order</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Assign Order Modal */}
      {assignTargetTable && (
        <div className="fixed inset-0 z-50 bg-[#231F1E]/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="saborea-card w-full max-w-[440px] rounded-[20px] p-5 sm:p-6 relative max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6D8BE]">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#9E7A38] font-medium">
                  Cashier POS
                </p>
                <h3 className="font-serif font-semibold text-[22px] text-[#231F1E]">
                  Assign order to {assignTargetTable.number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalTableId(null)}
                className="p-1.5 rounded-full text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 overflow-y-auto space-y-2.5 pr-1 flex-1">
              {menuItems.map((item) => {
                const qty = draftQuantities[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-[12px] border border-[#E5D7BE] bg-[#FDFBF7] px-3 py-2 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#DECBA4] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-serif text-[15px] text-[#231F1E] truncate">
                          {item.name}
                        </p>
                        <p className="text-[12px] text-[#9E7A38]">EGP {item.price}</p>
                      </div>
                    </div>

                    <div className="inline-flex items-center rounded-[8px] border border-[#DECBA4] bg-white overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftQuantities((p) => ({
                            ...p,
                            [item.id]: Math.max(0, (p[item.id] ?? 0) - 1),
                          }))
                        }
                        className="w-7 h-7 flex items-center justify-center text-[#6E655F] hover:bg-[#F5EBD6] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-[13px] font-semibold">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftQuantities((p) => ({
                            ...p,
                            [item.id]: (p[item.id] ?? 0) + 1,
                          }))
                        }
                        className="w-7 h-7 flex items-center justify-center text-[#6E655F] hover:bg-[#F5EBD6] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E6D8BE] flex items-center justify-between gap-3">
              <div className="text-[13px] text-[#6E655F]">
                Subtotal:{" "}
                <span className="font-serif font-semibold text-[17px] text-[#231F1E]">
                  EGP{" "}
                  {Object.entries(draftQuantities)
                    .reduce((sum, [id, q]) => {
                      const m = menuItems.find((i) => i.id === id);
                      return sum + (m ? m.price * q : 0);
                    }, 0)
                    .toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmAssign}
                className="saborea-gold-btn rounded-[10px] px-5 py-2 font-serif text-[15px] font-medium text-white cursor-pointer"
              >
                Confirm &amp; Preparing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printPreviewTable && (
        <div className="fixed inset-0 z-50 bg-[#231F1E]/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="saborea-card w-full max-w-[340px] rounded-[18px] p-5 relative">
            <button
              type="button"
              onClick={() => setPrintPreviewTable(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer no-print"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center border-b border-dashed border-[#DECBA4] pb-3">
              <p className="font-serif text-[20px] tracking-widest text-[#9E7A38]">
                SABOREA
              </p>
              <p className="text-[11px] text-[#6E655F]">A little joy in every bite.</p>
              <p className="mt-2 font-serif font-semibold text-[16px] text-[#231F1E]">
                {printPreviewTable.number} — Kitchen Ticket
              </p>
            </div>

            <div className="py-3 space-y-2 border-b border-dashed border-[#DECBA4] text-[13px]">
              {printPreviewTable.items.map((line) => (
                <div
                  key={`print-${line.menuItemId}`}
                  className="flex items-center justify-between"
                >
                  <span>
                    {line.quantity}× {line.name}
                  </span>
                  <span className="font-medium">EGP {getLineTotal(line)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-between font-serif font-semibold text-[18px]">
              <span>Total</span>
              <span className="text-[#9E7A38]">
                EGP {getTableTotal(printPreviewTable).toLocaleString()}
              </span>
            </div>

            <div className="mt-5 flex gap-2.5 no-print">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="saborea-gold-btn flex-1 rounded-[10px] py-2 text-[14px] font-medium text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintPreviewTable(null)}
                className="px-4 rounded-[10px] border border-[#DECBA4] text-[13.5px] text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#231F1E] text-[#FAF6EE] px-4 py-2 text-[13px] shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
