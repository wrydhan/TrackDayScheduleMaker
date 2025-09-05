# Track Day Schedule Maker

A comprehensive web application for generating professional track day schedules with driver management, group organization, and PDF export functionality.

## Features

### 🏁 Schedule Generation
- **Flexible Timing**: Configurable start time, session duration, and total track time
- **Smart Scheduling**: Automatic lunch break placement (before 2 PM)
- **Break Management**: Configurable breaks between sessions (0-60 minutes)
- **Mandatory Events**: Tech inspection, driver meeting, and lunch break

### 👥 Driver Management
- **Driver Profiles**: Name and skill level (Beginner, Intermediate, Advanced)
- **Dynamic Groups**: Create unlimited groups with any number of drivers
- **Skill-Based Grouping**: Automatic grouping by skill level
- **Random Grouping**: Alternative random distribution option

### 🎯 Drag & Drop Interface
- **Cross-Group Movement**: Drag drivers between different groups
- **Within-Group Reordering**: Reorder drivers within the same group
- **Real-time Updates**: Groups update automatically when you change settings
- **Visual Feedback**: Highlighted drop zones and smooth animations

### 📄 PDF Export
- **Professional Layout**: Clean, printable schedule format
- **Complete Information**: Schedule, driver groups, and statistics
- **Download Ready**: One-click PDF generation

### 🎨 Modern UI
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Text**: High contrast, readable fonts throughout
- **Tailwind CSS**: Modern, clean styling
- **Intuitive Interface**: Easy-to-use form controls and sliders

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: @dnd-kit
- **PDF Generation**: jsPDF
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/track-day-schedule-maker.git
   cd track-day-schedule-maker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Configure Track Day Settings
- Set start time (6 AM - 12 PM)
- Define total track time
- Choose session duration
- Select number of run groups (2-6)
- Pick grouping method (skill-based or random)
- Configure break durations

### 2. Add Drivers
- Enter driver names
- Assign skill levels
- Add/remove drivers as needed

### 3. Generate Schedule
- Click "Generate Schedule"
- Review the generated schedule
- Customize driver groups with drag & drop

### 4. Export PDF
- Click "Download PDF"
- Get a professional schedule ready for distribution

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── DraggableDriverGroups.tsx
│   └── TrackDayForm.tsx
├── lib/               # Utility functions
│   ├── pdfGenerator.ts
│   └── scheduleGenerator.ts
└── types/             # TypeScript definitions
    └── index.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ for the track day community
