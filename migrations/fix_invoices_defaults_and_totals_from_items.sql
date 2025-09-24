-- Backfill and enforce defaults for invoices

-- 1) Backfill due_date, currency, and grandTotal
UPDATE public.invoices SET due_date = CURRENT_DATE WHERE due_date IS NULL;
UPDATE public.invoices SET currency = 'SLL' WHERE currency IS NULL OR currency = '';
UPDATE public.invoices SET "grandTotal" = 0 WHERE "grandTotal" IS NULL;

-- 2) Set column defaults and not-null constraints (safe if data backfilled)
ALTER TABLE public.invoices ALTER COLUMN due_date SET DEFAULT CURRENT_DATE;
ALTER TABLE public.invoices ALTER COLUMN currency SET DEFAULT 'SLL';
ALTER TABLE public.invoices ALTER COLUMN "grandTotal" SET DEFAULT 0;

ALTER TABLE public.invoices ALTER COLUMN due_date SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN currency SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN "grandTotal" SET NOT NULL;

-- 3) Create totals updater from invoice_items (since invoice_line_items is not used)
CREATE OR REPLACE FUNCTION public.update_invoice_totals_from_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_subtotal numeric(12,2) := 0;
  invoice_grand_total numeric(12,2) := 0;
BEGIN
  -- Calculate subtotal from invoice_items
  SELECT COALESCE(SUM(total_price), 0)
  INTO invoice_subtotal
  FROM public.invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  invoice_grand_total := invoice_subtotal; -- no per-item tax/discount columns in invoice_items

  UPDATE public.invoices SET
    subtotal = invoice_subtotal,
    tax = COALESCE(tax, 0), -- retain invoice-level tax if any
    discount = COALESCE(discount, 0), -- retain invoice-level discount if any
    total = invoice_grand_total,
    "grandTotal" = invoice_grand_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Trigger on invoice_items to keep invoices totals in sync
DROP TRIGGER IF EXISTS trg_update_invoice_totals_from_items ON public.invoice_items;
CREATE TRIGGER trg_update_invoice_totals_from_items
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_totals_from_items();

-- 5) Initial recalc for existing invoices
UPDATE public.invoices i
SET 
  subtotal = COALESCE(src.subtotal, 0),
  total = COALESCE(src.subtotal, 0),
  "grandTotal" = COALESCE(src.subtotal, 0),
  updated_at = NOW()
FROM (
  SELECT invoice_id, COALESCE(SUM(total_price), 0) AS subtotal
  FROM public.invoice_items
  GROUP BY invoice_id
) src
WHERE i.id = src.invoice_id;


