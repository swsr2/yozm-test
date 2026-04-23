'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns'
import { ChevronLeft, ChevronRight, CheckCircle2, CalendarCheck } from 'lucide-react'

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const inIframe = window.self !== window.top
    if (!inIframe) return

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const sendHeight = () => {
      window.parent.postMessage(
        { type: 'resize', height: document.documentElement.scrollHeight },
        '*'
      )
    }
    sendHeight()
    const ro = new ResizeObserver(sendHeight)
    ro.observe(document.documentElement)
    return () => {
      ro.disconnect()
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const inIframe = window.self !== window.top
    if (!inIframe) return

    let startY = 0
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      const deltaY = startY - e.touches[0].clientY
      window.parent.postMessage({ type: 'scroll', deltaY }, '*')
      startY = e.touches[0].clientY
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const onDateClick = (day: Date) => {
    setSelectedDate(day)
    setSuccess(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return
    setLoading(true)
    setError('')

    const { error: dbError } = await supabase
      .from('appointments')
      .insert({
        name,
        email,
        date: format(selectedDate, 'yyyy-MM-dd')
      })

    setLoading(false)
    if (dbError) {
      setError('예약 신청 중 오류가 발생했습니다.')
      console.error(dbError)
    } else {
      setSuccess(true)
      setName('')
      setEmail('')
      setSelectedDate(null)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateFormat = "d"
  const rows = []
  let days = []
  let day = startDate
  let formattedDate = ""

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat)
      const cloneDay = day
      days.push(
        <div
          key={day.toString()}
          onClick={() => onDateClick(cloneDay)}
          className={`px-2 py-4 flex justify-center items-center cursor-pointer transition-all duration-200 rounded-xl text-sm font-medium
            ${!isSameMonth(day, monthStart) ? "text-gray-300 pointer-events-none" : "hover:bg-blue-50 text-gray-700"}
            ${isSameDay(day, selectedDate || new Date(0)) ? "bg-blue-600 !text-white shadow-md hover:bg-blue-700" : ""}
          `}
        >
          {formattedDate}
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(<div className="grid grid-cols-7 gap-1" key={day.toString()}>{days}</div>)
    days = []
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans text-gray-900">
      
      <header className="mb-10 text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">방문 예약 신청</h1>
        <p className="text-slate-500">원하시는 날짜를 선택하고 정보를 남겨주시면 연락드리겠습니다.</p>
      </header>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* 달력 영역 */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {format(currentDate, 'yyyy년 MM월')}
            </h2>
            <div className="flex space-x-2">
              <button title="이전 달" onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 transition"><ChevronLeft size={20} className="text-slate-600" /></button>
              <button title="다음 달" onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 transition"><ChevronRight size={20} className="text-slate-600" /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
          </div>
          
          <div className="space-y-1">
            {rows}
          </div>
        </div>

        {/* 폼 영역 */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[440px] flex flex-col justify-center">
          {success ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">예약 신청 완료!</h3>
              <p className="text-gray-500 leading-relaxed">관리자 승인 후 예약이 확정됩니다.<br/>신청해주셔서 감사합니다.</p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium transition"
              >
                다른 날짜 예약하기
              </button>
            </div>
          ) : selectedDate ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <div className="mb-6">
                <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-3">
                  {format(selectedDate, 'yyyy년 MM월 dd일')} 선택됨
                </div>
                <h3 className="text-2xl font-bold text-gray-800">방문 예약 정보 입력</h3>
                <p className="text-gray-500 text-sm mt-1">이름과 이메일을 남겨주시면 관리자 승인 후 안내해 드립니다.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                    placeholder="example@email.com"
                  />
                </div>
                
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                
                <div className="mt-auto pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transform transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
                  >
                    {loading ? '신청 중...' : '예약 신청하기'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <CalendarCheck size={32} className="text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-500">달력에서 원하시는<br/>날짜를 선택해주세요</p>
            </div>
          )}
        </div>
        
      </div>
      
      <footer className="mt-16 text-center text-sm text-slate-400">
        <p>&copy; 2024 방문 예약 시스템. All rights reserved.</p>
        <a href="/admin" className="text-blue-500 hover:underline mt-2 inline-block">관리자 페이지</a>
      </footer>
    </div>
  )
}
