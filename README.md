# Gold Loan Calculator WebApp

A professional, mobile-friendly web application for managing gold loan operations with a modern UI built with React, TypeScript, and Tailwind CSS.

## 🎯 Features

### Core Functionality
- **Dashboard**: Overview of all loans with key metrics and statistics
- **Loan Creation**: Create new gold loans with ornament details
- **Loan Management**: View, modify, and manage individual loans
- **Interest Payments**: Track and manage monthly interest payments
- **Loan Closing**: Close loans with detailed settlement records
- **Reports & Analytics**: Comprehensive reports with profit calculations
- **Settings**: Configure system rates, passwords, and bank details

### Key Features
✅ **Mobile-Friendly Design** - Fully responsive on all devices
✅ **Blue & Silver Theme** - Professional corporate design
✅ **Real-time Calculations** - Automatic loan amount and interest calculations
✅ **Sample Data** - Pre-loaded with example Karthik Raj loan
✅ **Data Validation** - Form validation with error messages
✅ **Print Ready** - Professional receipts and bills
✅ **Ornament Tracking** - Multiple ornaments per loan with weights and rates
✅ **Interest Management** - Monthly interest tracking and payment status

## 📋 Project Structure

```
Gold loan calculator/
├── App.jsx                    # Main App component
├── App.css                    # Global styles and CSS utilities
├── LoanManager.jsx           # Main layout and navigation
├── components/
│   ├── Dashboard.jsx         # Dashboard with statistics
│   ├── LoanCreation.jsx      # Loan creation form
│   ├── LoanDetails.jsx       # Loan details and management
│   ├── Reports.jsx           # Reports and analytics
│   └── Settings.jsx          # System settings
├── index.jsx                 # React entry point
├── index.html                # HTML entry point
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Navigate to project directory**
```bash
cd "Gold loan calculator"
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

The app will open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## 📱 Pages & Components

### Dashboard
- Overview of all loans with filters by date range
- Key metrics: Total loans, loan amount, interest paid, pending interests
- Recent loans table with quick actions
- Mobile-optimized layout

### Loan Creation
- Customer information form
- Loan details (rate, category, payment mode)
- Multiple ornament entry with automatic value calculation
- Real-time summary with amount calculation
- Form validation with error messages

### Loan Details
- Complete loan information display
- Customer details with photos (placeholder)
- Ornament details table
- Loan summary with amounts
- Interest payment tracking
- Pay interest functionality
- Loan closing dialog

### Reports
- Date range filtering
- Summary statistics
- Loan status breakdown (active/closed)
- Detailed loan report with profit calculations
- Export functionality (ready to implement)

### Settings
- Gold and silver rate configuration
- Login password management
- Staff permission controls
- Bank details management
- System preferences

## 🎨 Design Features

### Color Scheme (Blue & Silver Professional)
- Primary Blue: `#2563eb` - Actions, headers, focus states
- Dark Blue: `#1e40af` - Secondary actions, text
- Light Blue: `#dbeafe` - Backgrounds, subtle elements
- Silver/Gray: `#64748b` - Subtle accents, borders
- White: `#ffffff` - Cards, backgrounds

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Key Design Elements
- Gradient headers with icons
- Card-based layouts
- Hover effects and transitions
- Mobile menu with hamburger navigation
- Accessible form inputs
- Data tables with striping

## 💾 Data Structure

### Loan Object
```javascript
{
  id: 'A0001',
  customerName: 'string',
  customerPhone: 'string',
  guardianName: 'string',
  address: 'string',
  gender: 'M|F',
  loanDate: 'YYYY-MM-DD',
  loanTime: 'HH:MM AM/PM',
  ornamentCategory: 'GOLD|SILVER',
  interestRate: number,
  loanAmount: number,
  processingFee: number,
  amountGiven: number,
  paymentMode: 'CASH|UPI',
  bankName: 'string',
  ornaments: [{
    type: 'CHAIN|RING|AARAM|NECKLES|BANGLES',
    specification: 'string',
    quantity: number,
    grossWt: number,
    netWt: number,
    ratePerGram: number,
    value: number
  }],
  interests: [{
    id: 'AI0001',
    dueDate: 'YYYY-MM-DD',
    amount: number,
    paid: boolean,
    paidDate: 'YYYY-MM-DD',
    paymentMode: 'CASH|UPI'
  }],
  status: 'active|closed',
  closedDate: 'YYYY-MM-DD',
  totalInterestPaid: number
}
```

## 🔄 Sample Data

The app comes pre-loaded with a sample loan:
- **Loan ID**: A0001
- **Customer**: Karthik Raj (Phone: 9944817205)
- **Amount**: ₹67,200
- **Ornaments**: Gold Ring (916) and Gold Chain
- **Interest Rate**: 2% per month
- **Status**: Closed with interest payments recorded

## 🔗 API Integration (Future)

The app is ready to integrate with a backend API. Key endpoints to implement:

```
GET    /api/loans                 - List all loans
POST   /api/loans                 - Create new loan
GET    /api/loans/:id             - Get loan details
PUT    /api/loans/:id             - Update loan
DELETE /api/loans/:id             - Delete loan
POST   /api/loans/:id/interest    - Pay interest
POST   /api/loans/:id/close       - Close loan
GET    /api/reports               - Generate reports
GET    /api/settings              - Get system settings
PUT    /api/settings              - Update settings
```

## 🛠️ Technologies Used

- **React 18** - UI framework
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **JavaScript ES6+** - Modern JavaScript

## 📦 Dependencies

Key packages:
- `react` - React library
- `react-dom` - React DOM rendering
- `react-scripts` - Create React App scripts
- `tailwindcss` - CSS framework
- `lucide-react` - Beautiful icons
- `@tailwindcss/forms` - Form styling

## 🎓 Usage Examples

### Creating a New Loan
1. Navigate to "Loan Creation"
2. Fill in customer details
3. Add ornaments with weights and values
4. Review calculated amounts
5. Click "Create Loan"

### Recording Interest Payment
1. Go to loan details
2. Find pending interest in the table
3. Click "Pay" button
4. Enter payment date and mode
5. Click "Pay"

### Closing a Loan
1. Open loan details
2. Click "Close Loan" button
3. Enter closing amount and date
4. Confirm closure

## 🔐 Security Notes

- Passwords are stored as masked in the current implementation
- For production, implement proper backend authentication
- Consider adding role-based access control
- Implement audit logging for all transactions
- Use HTTPS for all communications

## 🚦 Status

**Current**: Frontend UI complete with mock data
**Next Steps**:
1. Connect to backend API
2. Implement database
3. Add user authentication
4. Add SMS/Email notifications
5. Implement PDF generation for receipts
6. Add multi-user support
7. Implement audit logs

## 📝 Notes

- All calculations are client-side (ready to be moved to backend)
- Sample data resets on page refresh (implement persistence)
- Currently using localStorage is not implemented (ready for state management)
- Mobile menu closes automatically on navigation
- Form validations are comprehensive

## 🤝 Contributing

To extend this application:

1. Add new components in `components/` directory
2. Update navigation in `LoanManager.jsx`
3. Follow the existing code style
4. Ensure mobile responsiveness
5. Test on various devices

## 📄 License

This is a professional application for gold loan management. All rights reserved.

## 👤 Author

Created as a professional gold loan management solution with modern UI/UX design.

## 📞 Support

For issues or feature requests, contact your development team.

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-03  
**Status**: Ready for backend integration
