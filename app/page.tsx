'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns'
import { ChevronLeft, ChevronRight, CheckCircle2, CalendarCheck, ArrowLeft } from 'lucide-react'

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [mobileStep, setMobileStep] = useState<'calendar' | 'form' | 'success'>('calendar')
  const [selectedLocation, setSelectedLocation] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const inIframe = window.self !== window.top
    if (!inIframe) return

    document.body.style.overflow = 'hidden'

    const sendHeight = () => {
      window.parent.postMessage(
        { type: 'resize', height: document.documentElement.scrollHeight },
        '*'
      )
    }
    window.addEventListener('load', sendHeight)
    window.addEventListener('resize', sendHeight)
    sendHeight()

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
      window.removeEventListener('load', sendHeight)
      window.removeEventListener('resize', sendHeight)
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.body.style.overflow = ''
    }
  }, [])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const onDateClick = (day: Date) => {
    if (!selectedLocation) {
      alert('지점을 먼저 선택해주세요.')
      return
    }
    setSelectedDate(day)
    setError('')
    setMobileStep('form')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedDate) return
    setLoading(true)
    setError('')

    if (typeof window !== 'undefined') {
      ;(window as any).dataLayer = (window as any).dataLayer || [];
      ;(window as any).dataLayer.push({
        event: 'acredo_test'
      });
    }

    const { error: dbError } = await supabase
      .from('appointments')
      .insert({
        name,
        email,
        date: format(selectedDate, 'yyyy-MM-dd'),
        location: selectedLocation,
      })

    setLoading(false)
    if (dbError) {
      setError('예약 신청 중 오류가 발생했습니다.')
      console.error(dbError)
    } else {
      setMobileStep('success')
      setName('')
      setEmail('')
      setSelectedDate(null)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  let days = []
  let day = startDate
  const rows = []

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day
      const label = format(day, 'd')
      days.push(
        <div
          key={day.toString()}
          onClick={() => onDateClick(cloneDay)}
          className={`flex justify-center items-center cursor-pointer transition-all duration-200 rounded-xl text-sm font-medium
            py-3 lg:py-4
            ${!isSameMonth(day, monthStart) ? 'text-gray-300 pointer-events-none' : 'hover:bg-blue-50 text-gray-700'}
            ${isSameDay(day, selectedDate || new Date(0)) ? 'bg-blue-600 !text-white shadow-md hover:bg-blue-700' : ''}
          `}
        >
          {label}
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(<div className="grid grid-cols-7 gap-1" key={day.toString()}>{days}</div>)
    days = []
  }

  const CalendarBlock = (
    <div className="bg-white p-3 lg:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {format(currentDate, 'yyyy년 MM월')}
        </h2>
        <div className="flex space-x-1">
          <button title="이전 달" onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 transition">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <button title="다음 달" onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 transition">
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
      </div>
      <div className="space-y-1">{rows}</div>
    </div>
  )

  const FormBlock = (
    <div className="bg-white p-3 lg:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
      {selectedDate && (
        <div className="mb-3">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-1">
            {format(selectedDate, 'yyyy년 MM월 dd일')} 선택됨
          </div>
          <h3 className="text-lg font-bold text-gray-800">방문 예약 정보 입력</h3>
          <p className="text-gray-500 text-xs mt-0.5">이름과 이메일을 남겨주시면 관리자 승인 후 안내해 드립니다.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50 focus:bg-white text-sm"
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
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50 focus:bg-white text-sm"
            placeholder="example@email.com"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition disabled:opacity-70 disabled:pointer-events-none"
        >
          {loading ? '신청 중...' : '예약 신청하기'}
        </button>
      </form>
    </div>
  )

  const SuccessBlock = (
    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="text-2xl font-bold text-gray-800">예약 신청 완료!</h3>
      <p className="text-gray-500 leading-relaxed">관리자 승인 후 예약이 확정됩니다.<br />신청해주셔서 감사합니다.</p>
      <button
        onClick={() => setMobileStep('calendar')}
        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium transition"
      >
        다른 날짜 예약하기
      </button>
    </div>
  )

  return (
    <div ref={rootRef} className="bg-slate-50 font-sans text-gray-900">

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden flex flex-col px-4 py-8">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">방문 예약 신청</h1>
          <p className="text-slate-500 text-sm mt-1.5">날짜를 선택하고 정보를 남겨주세요.</p>
        </header>

        {/* 스텝 인디케이터 */}
        {mobileStep !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full transition-all ${mobileStep === 'calendar' ? 'bg-blue-600 w-4' : 'bg-blue-200'}`} />
            <div className={`w-2 h-2 rounded-full transition-all ${mobileStep === 'form' ? 'bg-blue-600 w-4' : 'bg-blue-200'}`} />
          </div>
        )}

        {mobileStep !== 'success' && (
          <div className="w-full max-w-[200px] mx-auto mb-6">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-gray-700 shadow-sm text-center appearance-none cursor-pointer text-sm font-medium"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em`, textAlignLast: `center` }}
            >
              <option value="" disabled className="text-left">지점을 선택해주세요</option>
              <option value="청담" className="text-left">청담</option>
              <option value="종로" className="text-left">종로</option>
              <option value="부산" className="text-left">부산</option>
              <option value="대구" className="text-left">대구</option>
            </select>
          </div>
        )}

        {mobileStep === 'calendar' && CalendarBlock}

        {mobileStep === 'form' && selectedDate && (
          <div className="flex flex-col gap-3">
            {/* 날짜 배너 */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white text-center shadow-md">
              <p className="text-blue-200 text-xs mb-1">선택한 방문 날짜</p>
              <p className="text-2xl font-bold tracking-tight">{format(selectedDate, 'yyyy년 MM월 dd일')}</p>
              <button
                onClick={() => setMobileStep('calendar')}
                className="mt-3 flex items-center gap-1 text-blue-200 text-xs mx-auto hover:text-white transition"
              >
                <ArrowLeft size={13} /> 날짜 다시 선택
              </button>
            </div>
            {/* 폼 */}
            {FormBlock}
          </div>
        )}

        {mobileStep === 'success' && SuccessBlock}
      </div>

      {/* 데스크탑 레이아웃 */}
      <div className="hidden lg:flex flex-col items-center py-12 px-4 mt-4">
        <header className="mb-10 text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">방문 예약 신청</h1>
          <p className="text-slate-500">원하시는 날짜를 선택하고 정보를 남겨주시면 연락드리겠습니다.</p>
        </header>

        <div className="w-full max-w-xs mx-auto mb-10">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-6 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-gray-700 shadow-sm text-center appearance-none cursor-pointer text-lg font-medium"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, textAlignLast: `center` }}
          >
            <option value="" disabled className="text-left">지점을 선택해주세요</option>
            <option value="청담" className="text-left">청담</option>
            <option value="종로" className="text-left">종로</option>
            <option value="부산" className="text-left">부산</option>
            <option value="대구" className="text-left">대구</option>
          </select>
        </div>

        <div className="max-w-4xl w-full grid grid-cols-2 gap-8 items-start">
          {CalendarBlock}
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[440px] flex flex-col justify-center">
            {mobileStep === 'success' ? SuccessBlock : selectedDate ? FormBlock : (
              <div className="text-center flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center animate-pulse">
                  <CalendarCheck size={32} className="text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-500">달력에서 원하시는<br />날짜를 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
