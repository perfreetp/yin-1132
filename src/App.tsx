import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PatientList } from "@/pages/PatientList";
import { Assessment } from "@/pages/Assessment";
import { Followup } from "@/pages/Followup";
import { Alert } from "@/pages/Alert";
import { Statistics } from "@/pages/Statistics";
import Home from "@/pages/Home";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<Layout />}>
          <Route path="/patients" element={<PatientList />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/assessment/:patientId" element={<Assessment />} />
          <Route path="/followup" element={<Followup />} />
          <Route path="/alert" element={<Alert />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  );
}
