import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDownloadSharedTableAsCSV } from './api';
import spinner from '@/ui/assets/spinner.gif';

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

export default function EmailCallback() {
  const navigate = useNavigate();
  const downloadCSV = useDownloadSharedTableAsCSV();
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const messageId = url.href.substring(url.href.indexOf('report/') + 7, url.href.indexOf('/download'));
  const token = params.get('token');
  const reportName = params.get('ReportName');
  const fileType = params.get('fileType') || '';
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (token === null || reportName === null) {
      navigate('/');
      return;
    }
    const file = fileType.slice(0, 1).toUpperCase() + fileType.slice(1);
    downloadCSV.mutateAsync({ messageId, token }).then((response) => {
      if (response?.data?.link) {
        const link = document.createElement('a');
        link.href = response.data.link;
        link.setAttribute('download', reportName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('success');
        toast.success(file ? `${file} downloaded successfully` : 'Downloaded Successfully');
      }
    }).catch(() => {
      setStatus('failure');
      toast.error(file ? `Failed to download the ${file}` : 'Failed to download');
    });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center">
          <img src="/petavue-logo.svg" className="w-6 h-7" alt="Logo" />
          <span className="ml-3 text-xl text-primary-500 font-medium">Petavue</span>
        </div>
        <p>
          {status === 'loading' ? `Downloading ${reportName}` : status === 'success' ? `Downloaded ${reportName}` : `Failed to download ${reportName}`}
        </p>
        {status === 'loading' ? (
          <img src={spinner} alt="Loading" className="w-5 h-5" />
        ) : status === 'success' ? (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        ) : (
          <XCircleIcon className="w-5 h-5 text-red-500" />
        )}
      </div>
    </div>
  );
}
