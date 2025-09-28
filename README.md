# Utility Field Deployment and Fault Management System

The **Utility Field Deployment and Fault Management System** is a comprehensive solution designed to optimize how utility providers detect, respond to, and resolve faults across electricity, water, gas, and telecommunications networks. It combines real-time fault reporting, intelligent task assignment, and mobile-first field operations to ensure fast and efficient service restoration.

## Key Features

* **Real-Time Fault Reporting:** Faults can be reported via sensors, customer service channels, or field supervisors. The system centralizes these reports for quick visibility.
* **Fault Classification & Prioritization:** Incidents are automatically prioritized based on severity, location, and potential impact, enabling rapid decision-making.
* **Mapping & Visualization:** Clustering and geospatial mapping allow supervisors to view affected areas, assess disruption scope, and allocate resources effectively.
* **Smart Field Deployment:** Technicians are matched to jobs based on skill set, availability, and proximity, reducing response time and downtime.
* **Mobile Field Operations:** Field workers access job details, navigation, safety protocols, and real-time communication tools. They can update progress, capture photos, and log resources used.
* **Supervisory Oversight:** Supervisors monitor live progress, analyze performance, and manage escalations, ensuring smooth operations.
* **Analytics & Reporting:** Post-incident reports provide insights into recurring issues, maintenance needs, and service improvements.

## Benefits

* Faster fault detection and resolution
* Improved operational efficiency and resource utilization
* Enhanced collaboration between field teams and management
* Data-driven insights to prevent recurring faults
* Higher customer satisfaction and service reliability

This system empowers utility companies to respond proactively, reduce service interruptions, and maintain transparency across field operations.


## Project Setup

This project uses **React Native + Expo**, TypeScript, and Git LFS for large assets.

### Prerequisites

* Node.js 18+
* Expo CLI (`npm install -g expo-cli`)
* Git & Git LFS (`git lfs install`)

### Clone Repository

```bash

gitlfsinstall

gitclonehttps://github.com/elvin2words/utilityApp.git

cdutilityApp

npminstall
```



### Project Structure

App.tsx
app.config.js
assets/
  ├─ fonts/
  ├─ lottie/
  └─ icons/
src/
  ├─ api/
  ├─ components/
  ├─ context/
  ├─ hooks/
  ├─ lib/
  ├─ navigation/
  ├─ screens/
  ├─ shared/
  ├─ stores/
  ├─ types/
  └─ utils/
credentials/
docs/
babel.config.js
tsconfig.json
package.json
