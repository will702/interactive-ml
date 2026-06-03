import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './routes/Index'
import Trees from './routes/Trees'
import SVM from './routes/SVM'
import Clustering from './routes/Clustering'
import DimRed from './routes/DimRed'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/trees" element={<Trees />} />
        <Route path="/svm" element={<SVM />} />
        <Route path="/clustering" element={<Clustering />} />
        <Route path="/dimred" element={<DimRed />} />
      </Routes>
    </BrowserRouter>
  )
}
