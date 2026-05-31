export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      business_profiles: {
        Row: {
          user_id: string;
          business_name: string;
          address: string;
          gstin: string | null;
          state: string;
          state_code: string;
          phone: string | null;
          email: string | null;
          bank_account_name: string | null;
          bank_name: string | null;
          bank_account_number: string | null;
          bank_ifsc: string | null;
          upi_id: string | null;
          terms_and_conditions: string | null;
          invoice_prefix: string;
          logo_url: string | null;
          signature_url: string | null;
          financial_year_lock_before: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["business_profiles"]["Row"]> & {
          user_id: string;
          business_name: string;
          address: string;
          state: string;
          state_code: string;
          invoice_prefix: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_profiles"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          customer_name: string;
          gstin: string | null;
          address: string;
          state: string;
          state_code: string;
          place_of_supply: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          user_id: string;
          customer_name: string;
          address: string;
          state: string;
          state_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          item_name: string;
          hsn_sac_code: string | null;
          hsn_code: string | null;
          default_gst_rate: number;
          unit: string;
          rate: number;
          description: string | null;
          item_type: "goods" | "service";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          user_id: string;
          item_name: string;
          default_gst_rate: number;
          unit: string;
          rate: number;
          item_type: "goods" | "service";
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          source_invoice_id: string | null;
          document_type: "gst_invoice" | "non_gst_invoice" | "quotation" | "proforma_invoice";
          invoice_number: string;
          sequence_number: number;
          financial_year_label: string;
          issue_date: string;
          due_date: string | null;
          status: "draft" | "paid" | "partially_paid" | "unpaid" | "cancelled";
          payment_terms: string | null;
          notes: string | null;
          remarks: string | null;
          place_of_supply_state_code: string | null;
          is_inter_state: boolean;
          subtotal: number;
          item_discount_total: number;
          invoice_discount_total: number;
          taxable_amount: number;
          cgst_total: number;
          sgst_total: number;
          igst_total: number;
          total_tax_amount: number;
          grand_total: number;
          amount_paid: number;
          amount_due: number;
          amount_in_words: string;
          irn: string | null;
          ack_number: string | null;
          ack_date: string | null;
          irn_generated_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          user_id: string;
          customer_id: string;
          document_type: Database["public"]["Tables"]["invoices"]["Row"]["document_type"];
          invoice_number: string;
          sequence_number: number;
          financial_year_label: string;
          issue_date: string;
          status: Database["public"]["Tables"]["invoices"]["Row"]["status"];
          is_inter_state: boolean;
          subtotal: number;
          item_discount_total: number;
          invoice_discount_total: number;
          taxable_amount: number;
          cgst_total: number;
          sgst_total: number;
          igst_total: number;
          total_tax_amount: number;
          grand_total: number;
          amount_paid: number;
          amount_due: number;
          amount_in_words: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          product_id: string | null;
          item_name: string;
          description: string | null;
          hsn_sac_code: string | null;
          quantity: number;
          unit: string;
          rate: number;
          gst_rate: number;
          discount_percent: number;
          discount_amount: number;
          line_subtotal: number;
          taxable_amount: number;
          cgst_amount: number;
          sgst_amount: number;
          igst_amount: number;
          line_total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]> & {
          invoice_id: string;
          item_name: string;
          quantity: number;
          unit: string;
          rate: number;
          gst_rate: number;
          discount_percent: number;
          discount_amount: number;
          line_subtotal: number;
          taxable_amount: number;
          cgst_amount: number;
          sgst_amount: number;
          igst_amount: number;
          line_total: number;
          sort_order: number;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          user_id: string;
          payment_date: string;
          payment_mode: "cash" | "bank_transfer" | "upi" | "cheque";
          transaction_reference: string | null;
          amount: number;
          notes: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          invoice_id: string;
          user_id: string;
          payment_date: string;
          payment_mode: Database["public"]["Tables"]["payments"]["Row"]["payment_mode"];
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
    };
    Views: {
      invoice_list_view: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          customer_name: string;
          document_type: Database["public"]["Tables"]["invoices"]["Row"]["document_type"];
          invoice_number: string;
          financial_year_label: string;
          issue_date: string;
          due_date: string | null;
          status: Database["public"]["Tables"]["invoices"]["Row"]["status"];
          subtotal: number;
          taxable_amount: number;
          cgst_total: number;
          sgst_total: number;
          igst_total: number;
          grand_total: number;
          amount_paid: number;
          amount_due: number;
          total_tax_amount: number;
          created_at: string;
        };
      };
    };
    Functions: {
      create_invoice_with_items: {
        Args: {
          payload: Json;
        };
        Returns: string;
      };
      duplicate_invoice_document: {
        Args: {
          source_invoice_id: string;
          target_document_type: string;
        };
        Returns: string;
      };
      record_invoice_payment: {
        Args: {
          payload: Json;
        };
        Returns: string;
      };
    };
  };
};
