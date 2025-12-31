import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ReportingResponse } from 'src/app/interfaces/ReportinData';
import { Expense } from 'src/app/interfaces/Expense';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Exporte les données du reporting en PDF
   */
  exportToPDF(data: ReportingResponse, filters?: { start_date?: string; end_date?: string }): void {
    const doc = new jsPDF();

    // Titre du document
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de Tableau de Bord', 14, 20);

    // Informations sur les filtres
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPosition = 30;

    if (filters?.start_date && filters?.end_date) {
      doc.text(`Période: Du ${this.formatDate(filters.start_date)} au ${this.formatDate(filters.end_date)}`, 14, yPosition);
    } else if (filters?.start_date) {
      doc.text(`Date: ${this.formatDate(filters.start_date)}`, 14, yPosition);
    } else {
      const currentYear = new Date().getFullYear();
      doc.text(`Année: ${currentYear}`, 14, yPosition);
    }

    yPosition += 5;
    doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPosition);

    yPosition += 10;

    // Section: Statistiques Globales
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques Globales', 14, yPosition);
    yPosition += 7;

    const globalStats = data.data.getAllStatistics;

    autoTable(doc, {
      startY: yPosition,
      head: [['Catégorie', 'Valeur']],
      body: [
        ['Nombre de Clients', globalStats.customers.toString()],
        ['Nombre de Fournisseurs', globalStats.suppliers.toString()],
        ['Nombre de Produits', globalStats.products.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Section: Statistiques des Factures
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques des Factures', 14, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Statut', 'Nombre']],
      body: [
        ['Total', globalStats.invoices.total.toString()],
        ['Payées', globalStats.invoices.paid.toString()],
        ['Non Payées', globalStats.invoices.no_paid.toString()],
        ['Partielles', globalStats.invoices.partial.toString()],
        ['Annulées', globalStats.invoices.cancelled.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Section: Montants
    if (globalStats.amounts) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Résumé des Montants', 14, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [['Description', 'Montant (FCFA)']],
        body: [
          ['Chiffre d\'Affaires', this.formatNumber(globalStats.amounts.total_amount)],
          ['Total Encaissé', this.formatNumber(globalStats.amounts.total_paid)],
          ['Créances en Cours', this.formatNumber(globalStats.amounts.total_unpaid)],
          ['Taux de Paiement', `${globalStats.amounts.payment_rate.toFixed(2)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Section: Détails Mensuels/Période
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Détails par Période', 14, yPosition);
    yPosition += 7;

    const summaryData = data.data.invoiceStats.summary_data;
    const dataArray = Array.isArray(summaryData) ? summaryData : [summaryData];

    const tableData = dataArray.map(item => [
      item.month || item.period || `${item.start_date} - ${item.end_date}`,
      this.formatNumber(item.total_amount),
      this.formatNumber(item.total_paid),
      this.formatNumber(item.total_unpaid),
      `${item.payment_rate.toFixed(2)}%`,
      item.invoice_count.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Période', 'Montant Total', 'Payé', 'Non Payé', 'Taux', 'Nb Factures']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 },
    });

    // Sauvegarder le PDF
    const fileName = this.generateFileName('rapport-dashboard', filters, 'pdf');
    doc.save(fileName);
  }

  /**
   * Exporte les données du reporting en Excel
   */
  exportToExcel(data: ReportingResponse, filters?: { start_date?: string; end_date?: string }): void {
    const workbook = XLSX.utils.book_new();

    // Feuille 1: Statistiques Globales
    const globalStats = data.data.getAllStatistics;

    const globalStatsData = [
      ['RAPPORT DE TABLEAU DE BORD'],
      [],
      ['Période:', this.getFilterLabel(filters)],
      ['Date de génération:', new Date().toLocaleDateString('fr-FR')],
      [],
      ['STATISTIQUES GLOBALES'],
      ['Catégorie', 'Valeur'],
      ['Nombre de Clients', globalStats.customers],
      ['Nombre de Fournisseurs', globalStats.suppliers],
      ['Nombre de Produits', globalStats.products],
      [],
      ['STATISTIQUES DES FACTURES'],
      ['Statut', 'Nombre'],
      ['Total', globalStats.invoices.total],
      ['Payées', globalStats.invoices.paid],
      ['Non Payées', globalStats.invoices.no_paid],
      ['Partielles', globalStats.invoices.partial],
      ['Annulées', globalStats.invoices.cancelled],
      [],
      ['STATISTIQUES DES VENTES'],
      ['Statut', 'Nombre', 'Montant'],
      ['Confirmées', globalStats.sales.confirmed, globalStats.sales.confirmed_amount],
      ['En Attente', globalStats.sales.pending, globalStats.sales.pending_amount],
      ['Annulées', globalStats.sales.cancelled, 0],
    ];

    if (globalStats.amounts) {
      globalStatsData.push(
        [],
        ['RÉSUMÉ DES MONTANTS'],
        ['Description', 'Montant (FCFA)'],
        ['Chiffre d\'Affaires', globalStats.amounts.total_amount],
        ['Total Encaissé', globalStats.amounts.total_paid],
        ['Créances en Cours', globalStats.amounts.total_unpaid],
        ['Taux de Paiement', `${globalStats.amounts.payment_rate.toFixed(2)}%`]
      );
    }

    const ws1 = XLSX.utils.aoa_to_sheet(globalStatsData);
    XLSX.utils.book_append_sheet(workbook, ws1, 'Statistiques Globales');

    // Feuille 2: Détails par Période
    const summaryData = data.data.invoiceStats.summary_data;
    const dataArray = Array.isArray(summaryData) ? summaryData : [summaryData];

    const periodDetailsData: any[] = [
      ['DÉTAILS PAR PÉRIODE'],
      [],
      ['Période', 'Montant Total', 'Montant Payé', 'Montant Non Payé', 'Montant Annulé', 'Taux de Paiement', 'Nb Factures', 'Factures Actives', 'Factures Annulées']
    ];

    dataArray.forEach(item => {
      periodDetailsData.push([
        item.month || item.period || `${item.start_date} - ${item.end_date}`,
        item.total_amount,
        item.total_paid,
        item.total_unpaid,
        item.total_cancel,
        `${item.payment_rate.toFixed(2)}%`,
        item.invoice_count,
        item.active_invoice_count,
        item.cancelled_invoice_count
      ] as any[]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(periodDetailsData);
    XLSX.utils.book_append_sheet(workbook, ws2, 'Détails par Période');

    // Sauvegarder le fichier Excel
    const fileName = this.generateFileName('rapport-dashboard', filters, 'xlsx');
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Formate une date au format français
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  /**
   * Formate un nombre avec séparateur de milliers
   */
  private formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  /**
   * Génère un label pour les filtres
   */
  private getFilterLabel(filters?: { start_date?: string; end_date?: string }): string {
    if (filters?.start_date && filters?.end_date) {
      return `Du ${this.formatDate(filters.start_date)} au ${this.formatDate(filters.end_date)}`;
    } else if (filters?.start_date) {
      return `Le ${this.formatDate(filters.start_date)}`;
    } else {
      return `Année ${new Date().getFullYear()}`;
    }
  }

  /**
   * Génère un nom de fichier avec horodatage
   */
  private generateFileName(baseName: string, filters?: { start_date?: string; end_date?: string }, extension: string = 'pdf'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    let filterSuffix = '';

    if (filters?.start_date && filters?.end_date) {
      filterSuffix = `_${filters.start_date}_${filters.end_date}`;
    } else if (filters?.start_date) {
      filterSuffix = `_${filters.start_date}`;
    } else {
      filterSuffix = `_${new Date().getFullYear()}`;
    }

    return `${baseName}${filterSuffix}_${timestamp}.${extension}`;
  }

  /**
   * Exporte les dépenses en PDF
   */
  exportExpensesToPDF(expenses: Expense[], filters: { start_date: string; end_date?: string }): void {
    const doc = new jsPDF();

    // Titre du document
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des Dépenses', 14, 20);

    // Informations sur les filtres
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPosition = 30;

    if (filters.start_date && filters.end_date) {
      doc.text(`Période: Du ${this.formatDate(filters.start_date)} au ${this.formatDate(filters.end_date)}`, 14, yPosition);
    } else if (filters.start_date) {
      doc.text(`Date de début: ${this.formatDate(filters.start_date)}`, 14, yPosition);
    }

    yPosition += 5;
    doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPosition);

    yPosition += 10;

    // Calcul du total des dépenses
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Informations de synthèse
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Synthèse', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: yPosition,
      head: [['Catégorie', 'Valeur']],
      body: [
        ['Nombre de dépenses', expenses.length.toString()],
        ['Montant total', `${this.formatNumber(totalAmount)} FCFA`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Section: Détails des dépenses
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Détails des Dépenses', 14, yPosition);
    yPosition += 7;

    const tableData = expenses.map(expense => [
      this.formatDate(expense.expense_date),
      expense.title,
      expense.description || '-',
      this.formatNumber(expense.amount) + ' FCFA'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Titre', 'Description', 'Montant']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 45 },
        2: { cellWidth: 70 },
        3: { cellWidth: 35, halign: 'right' }
      }
    });

    // Sauvegarder le PDF
    const fileName = this.generateFileName('depenses', filters, 'pdf');
    doc.save(fileName);
  }
}
