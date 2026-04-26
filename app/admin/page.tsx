'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Clock, Calendar, User, Mail, ShieldAlert, XCircle } from 'lucide-react'

type Appointment = {
  id: string
  name: string
  email: string
  date: string
  location?: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [adminBranch, setAdminBranch] = useState('')

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  // 지점별 계정 정보
  const BRANCH_ACCOUNTS: Record<string, { pw: string, branchName: string }> = {
    'cheongdam': { pw: '1234', branchName: '청담' },
    'jongro': { pw: '1234', branchName: '종로' },
    'busan': { pw: '1234', branchName: '부산' },
    'daegu': { pw: '1234', branchName: '대구' },
    'master': { pw: 'master123', branchName: '전체' }
  }

  // 간단 로그인 처리
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    const account = BRANCH_ACCOUNTS[adminId.toLowerCase()]

    if (account && password === account.pw) {
      setIsAuthenticated(true)
      setAdminBranch(account.branchName)
      fetchAppointments(account.branchName)
    } else {
      setLoginError('아이디 또는 비밀번호가 일치하지 않습니다.')
    }
  }

  // 데이터 가져오기
  const fetchAppointments = async (branch?: string) => {
    const currentBranch = branch || adminBranch
    setLoading(true)

    let query = supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })

    if (currentBranch && currentBranch !== '전체') {
      // 해당 지점의 로케이션만 필터링 (Supabase에 location 컬럼이 있다고 가정)
      query = query.eq('location', currentBranch)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch error:', error)
      // location 컬럼이 없을 때 발생하는 에러 등에 대응하기 위해 빈 배열 대신 원래 데이터 유지(?)
      // 하지만 에러시엔 비워두는게 안전합니다.
      setAppointments([])
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }

  // 승인 처리
  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'approved' })
      .eq('id', id)

    if (error) {
      alert('승인 처리 중 오류가 발생했습니다.')
      console.error(error)
    } else {
      // 리스트 갱신
      fetchAppointments()
    }
  }

  // 취소 처리
  const handleCancel = async (id: string) => {
    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) return
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      alert('취소 처리 중 오류가 발생했습니다.')
      console.error(error)
    } else {
      fetchAppointments()
    }
  }



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">관리자 로그인</h1>
            <p className="text-slate-500 text-sm mt-2">비밀번호를 입력하여 시스템에 접근하세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="지점 아이디 (예: cheongdam)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50 focus:bg-white text-center text-lg"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50 focus:bg-white text-center tracking-widest text-lg"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold shadow-lg transition"
            >
              로그인
            </button>
            <div className="text-center pt-4">
              <a href="/" className="text-sm text-slate-400 hover:text-blue-600 transition">← 메인으로 돌아가기</a>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">예약 관리 대시보드</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold text-sm rounded-lg">{adminBranch} 지점</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">고객들의 예약 요청을 확인하고 승인하세요.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => fetchAppointments()} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition">
              새로고침
            </button>
            <button onClick={() => { setIsAuthenticated(false); setAdminBranch(''); setAdminId(''); setPassword(''); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition">
              로그아웃
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                <p>접수된 예약이 없습니다.</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                        apt.status === 'approved' ? 'bg-green-50 text-green-700' :
                        apt.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                      {apt.status === 'approved' && <CheckCircle2 size={14} className="mr-1" />}
                      {apt.status === 'cancelled' && <XCircle size={14} className="mr-1" />}
                      {apt.status === 'pending' && <Clock size={14} className="mr-1" />}
                      {apt.status === 'approved' ? '승인완료' : apt.status === 'cancelled' ? '취소됨' : '대기중'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(apt.created_at), 'MM/dd HH:mm')}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-slate-700">
                      <Calendar size={18} className="text-slate-400 mr-3" />
                      <span className="font-semibold">{apt.date}</span>
                      {apt.location && <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">{apt.location}</span>}
                    </div>
                    <div className="flex items-center text-slate-700">
                      <User size={18} className="text-slate-400 mr-3" />
                      <span>{apt.name}</span>
                    </div>
                    <div className="flex items-center text-slate-600 text-sm">
                      <Mail size={18} className="text-slate-400 mr-3" />
                      <a href={`mailto:${apt.email}`} className="hover:text-blue-500 hover:underline truncate">{apt.email}</a>
                    </div>
                  </div>

                  {apt.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(apt.id)}
                        className="flex-[1.5] py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition flex justify-center items-center shadow-sm"
                      >
                        <CheckCircle2 size={16} className="mr-1.5" />
                        승인
                      </button>
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition flex justify-center items-center"
                      >
                        <XCircle size={16} className="mr-1.5" />
                        취소
                      </button>
                    </div>
                  )}
                  {apt.status === 'approved' && (
                    <div className="flex gap-2">
                      <button
                        disabled
                        className="flex-[1.5] py-2.5 bg-slate-50 text-slate-400 rounded-xl text-sm font-semibold cursor-not-allowed flex justify-center items-center border border-slate-100"
                      >
                        <CheckCircle2 size={16} className="mr-1.5" />
                        승인됨
                      </button>
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition flex justify-center items-center"
                      >
                        <XCircle size={16} className="mr-1.5" />
                        예약 취소
                      </button>
                    </div>
                  )}
                  {apt.status === 'cancelled' && (
                    <button
                      disabled
                      className="w-full py-2.5 bg-red-50 text-red-400 rounded-xl text-sm font-semibold cursor-not-allowed flex justify-center items-center border border-red-100"
                    >
                      <XCircle size={16} className="mr-1.5" />
                      취소된 예약
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  )
}
