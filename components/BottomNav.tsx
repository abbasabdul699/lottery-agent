import { useRouter } from 'next/router';
import Link from 'next/link';

export default function BottomNav() {
  const router = useRouter();
  const currentPath = router.pathname;

  const isHomeActive = currentPath === '/dashboard';
  const isScanActive = currentPath === '/scan';
  const isRegisterActive = currentPath === '/daily-report';
  const isReportsActive = currentPath === '/reports';
  const isProfileActive = currentPath === '/profile';

  // Colors from Figma
  const activeBlue = '#386bf6';
  const inactiveGray = '#9db2ce';

  const NavItem = ({ 
    href, 
    isActive, 
    icon, 
    label 
  }: { 
    href: string; 
    isActive: boolean; 
    icon: React.ReactNode; 
    label: string;
  }) => (
    <Link 
      href={href} 
      className="flex flex-col items-center relative shrink-0"
      style={{ 
        width: '70px',
        height: '75px',
        padding: '12.5px 15px',
        gap: isActive ? '5px' : '12px',
      }}
    >
      <div 
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: '24px', height: '24px' }}
      >
        {isActive && (
          <div
            className="absolute rounded-full"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: activeBlue,
            }}
          />
        )}
        <div className="relative z-10" style={{ width: '100%', height: '100%' }}>
          {icon}
        </div>
      </div>
      <span 
        style={{ 
          fontSize: '12px',
          lineHeight: 'normal',
          color: isActive ? activeBlue : inactiveGray,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: isActive ? 500 : 400,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ height: '107px' }}>
      {/* Background with curved top - matching Figma Union shape */}
      <div 
        className="absolute inset-0 bg-white" 
        style={{ 
          top: '32px',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '22px',
        }}
      ></div>
      
      {/* Navigation content */}
      <div 
        className="absolute flex items-center justify-around py-0" 
        style={{ 
          height: '75px', 
          top: '32px', 
          left: 0, 
          right: 0,
          paddingLeft: '25px',
          paddingRight: '25px',
        }}
      >
        {/* Home */}
        <NavItem
          href="/dashboard"
          isActive={isHomeActive}
          label="Home"
          icon={
            <svg
              height="30"
              viewBox="0 1 511 511.999"
              width="30"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              <path
                d="m498.699219 222.695312c-.015625-.011718-.027344-.027343-.039063-.039062l-208.855468-208.847656c-8.902344-8.90625-20.738282-13.808594-33.328126-13.808594-12.589843 0-24.425781 4.902344-33.332031 13.808594l-208.746093 208.742187c-.070313.070313-.144532.144531-.210938.214844-18.28125 18.386719-18.25 48.21875.089844 66.558594 8.378906 8.382812 19.441406 13.234375 31.273437 13.746093.484375.046876.96875.070313 1.457031.070313h8.320313v153.695313c0 30.417968 24.75 55.164062 55.167969 55.164062h81.710937c8.285157 0 15-6.71875 15-15v-120.5c0-13.878906 11.292969-25.167969 25.171875-25.167969h48.195313c13.878906 0 25.167969 11.289063 25.167969 25.167969v120.5c0 8.28125 6.714843 15 15 15h81.710937c30.421875 0 55.167969-24.746094 55.167969-55.164062v-153.695313h7.71875c12.585937 0 24.421875-4.902344 33.332031-13.8125 18.359375-18.367187 18.367187-48.253906.027344-66.632813zm-21.242188 45.421876c-3.238281 3.238281-7.542969 5.023437-12.117187 5.023437h-22.71875c-8.285156 0-15 6.714844-15 15v168.695313c0 13.875-11.289063 25.164062-25.167969 25.164062h-66.710937v-105.5c0-30.417969-24.746094-55.167969-55.167969-55.167969h-48.195313c-30.421875 0-55.171875 24.75-55.171875 55.167969v105.5h-66.710937c-13.875 0-25.167969-11.289062-25.167969-25.164062v-168.695313c0-8.285156-6.714844-15-15-15h-22.328125c-.234375-.015625-.464844-.027344-.703125-.03125-4.46875-.078125-8.660156-1.851563-11.800781-4.996094-6.679688-6.679687-6.679688-17.550781 0-24.234375.003906 0 .003906-.003906.007812-.007812l.011719-.011719 208.847656-208.839844c3.234375-3.238281 7.535157-5.019531 12.113281-5.019531 4.574219 0 8.875 1.78125 12.113282 5.019531l208.800781 208.796875c.03125.03125.066406.0625.097656.09375 6.644531 6.691406 6.632813 17.539063-.03125 24.207032zm0 0"
                fill={isHomeActive ? '#ffffff' : inactiveGray}
              />
            </svg>
          }
        />

        {/* Register */}
        <NavItem
          href="/daily-report"
          isActive={isRegisterActive}
          label="Register"
          icon={
            <svg
              height="24"
              viewBox="0 0 512 512"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              <g>
                <path
                  d="m290.765 222.449h-24.457c-5.523 0-10 4.477-10 10s4.477 10 10 10h24.457c5.523 0 10-4.477 10-10s-4.477-10-10-10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m331.033 242.449h24.457c5.523 0 10-4.477 10-10s-4.477-10-10-10h-24.457c-5.523 0-10 4.477-10 10s4.477 10 10 10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m420.213 242.449c5.523 0 10-4.477 10-10s-4.477-10-10-10h-24.457c-5.523 0-10 4.477-10 10s4.477 10 10 10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m284.793 275.623h-27.243c-5.523 0-10 4.477-10 10s4.477 10 10 10h27.243c5.523 0 10-4.477 10-10s-4.477-10-10-10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m329.639 295.623h27.244c5.523 0 10-4.477 10-10s-4.477-10-10-10h-27.244c-5.523 0-10 4.477-10 10s4.477 10 10 10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m428.972 295.623c5.523 0 10-4.477 10-10s-4.477-10-10-10h-27.243c-5.523 0-10 4.477-10 10s4.477 10 10 10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m277.712 328.796h-30.542c-5.523 0-10 4.477-10 10s4.477 10 10 10h30.542c5.523 0 10-4.477 10-10s-4.477-10-10-10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m358.532 328.796h-30.542c-5.523 0-10 4.477-10 10s4.477 10 10 10h30.542c5.523 0 10-4.477 10-10s-4.477-10-10-10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m439.352 328.796h-30.542c-5.523 0-10 4.477-10 10s4.477 10 10 10h30.542c5.523 0 10-4.477 10-10s-4.477-10-10-10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m194.134 450.576h123.732c5.523 0 10-4.477 10-10s-4.477-10-10-10h-123.732c-5.523 0-10 4.477-10 10s4.477 10 10 10z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
                <path
                  d="m511.998 389.431c-.001-.361-.022-.741-.063-1.099l-23.859-207.701c-.58-5.048-4.854-8.859-9.935-8.859h-100.737v-50.822h69.114c11.912 0 21.603-9.679 21.603-21.577v-67.446c0-11.897-9.691-21.577-21.603-21.577h-158.227c-11.912 0-21.603 9.68-21.603 21.577v67.446c0 11.897 9.691 21.577 21.603 21.577h69.113v50.823h-156.683v-20.19c0-5.523-4.477-10-10-10h-92.024c-5.523 0-10 4.477-10 10v20.19h-54.838c-5.081 0-9.355 3.811-9.935 8.859l-23.859 207.7c-.043.37-.065.767-.065 1.141v82.882c0 16.153 13.161 29.295 29.337 29.295h453.296c16.192 0 29.366-13.142 29.366-29.295v-82.882c.001-.014-.001-.028-.001-.042zm-225.31-290.058v-67.446c0-.84.749-1.577 1.603-1.577h158.227c.854 0 1.603.737 1.603 1.577v67.446c0 .854-.734 1.577-1.603 1.577h-158.227c-.853 0-1.603-.737-1.603-1.577zm-177.991 62.209h72.024v114.041h-72.024zm-65.921 30.19h45.921v83.851h-5.697c-5.523 0-10 4.477-10 10s4.477 10 10 10h123.391c5.523 0 10-4.477 10-10s-4.477-10-10-10h-5.669v-83.851h268.502l21.562 187.701h-469.572zm449.224 280.583c0 5.125-4.202 9.295-9.366 9.295h-453.297c-5.148 0-9.337-4.169-9.337-9.295v-72.882h472z"
                  fill={isRegisterActive ? '#ffffff' : inactiveGray}
                />
              </g>
            </svg>
          }
        />

        {/* Scan */}
        <NavItem
          href="/scan"
          isActive={isScanActive}
          label="Scan"
          icon={
            <svg
              height="30"
              viewBox="0 0 512 512"
              width="30"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              <path
                d="m30 30h90v-30h-120v120h30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m392 0v30h90v90h30v-120zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m482 482h-90v30h120v-120h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m30 392h-30v120h120v-30h-90zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m61 60v150h150v-90h30v-30h-30v-30zm120 120h-90v-90h90zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m451 450v-150h-60v-30h-30v30h-90v30h30v30h-30v30h30v60zm-120-120h90v90h-90zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m151 270h60v-30h-150v30h60v30h-30v30h30v60h-30v30h30v30h150v-30h-30v-30h-30v30h-60v-30h30v-30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m121 120h30v30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m361 120h30v30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m391 210h60v-150h-150v150h60v30h30zm-60-30v-90h90v90zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m451 270v-30c-7.257812 0-52.691406 0-60 0v30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m361 360h30v30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m241 330h30v30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m181 360h30c0-7.257812 0-52.691406 0-60h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m211 270h30v30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m91 330h-30v60h30c0-7.257812 0-52.691406 0-60zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m61 420h30v30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m241 60h30v30h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m241 180h30c0-7.257812 0-52.691406 0-60h-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
              <path
                d="m271 240v-30h-30v60h120v-30zm0 0"
                fill={isScanActive ? '#ffffff' : inactiveGray}
              />
            </svg>
          }
        />

        {/* Reports */}
        <NavItem
          href="/reports"
          isActive={isReportsActive}
          label="Reports"
          icon={
            <svg
              height="30"
              viewBox="0 0 512 512"
              width="30"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              <g>
                <path
                  d="m386.073 295.25h-151.106c-4.143 0-7.5 3.358-7.5 7.5s3.357 7.5 7.5 7.5h151.106c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5zm0 113h-151.106c-4.143 0-7.5 3.358-7.5 7.5s3.357 7.5 7.5 7.5h151.106c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5zm0-30h-151.106c-4.143 0-7.5 3.358-7.5 7.5s3.357 7.5 7.5 7.5h151.106c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5zm0-113h-151.106c-4.143 0-7.5 3.358-7.5 7.5s3.357 7.5 7.5 7.5h151.106c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5zm50.29 26.965c4.143 0 7.5-3.358 7.5-7.5v-153.983c-.03-1.52-.529-3.715-2.196-5.303l-123.232-123.232c-1.247-1.121-2.825-2.197-5.304-2.197h-207.494c-20.678 0-37.5 16.822-37.5 37.5v437c0 20.678 16.822 37.5 37.5 37.5h300.727c20.678 0 37.5-16.822 37.5-37.5v-154.785c0-4.142-3.357-7.5-7.5-7.5s-7.5 3.358-7.5 7.5v154.785c0 12.407-10.094 22.5-22.5 22.5h-300.727c-12.406 0-22.5-10.093-22.5-22.5v-437c0-12.407 10.094-22.5 22.5-22.5h199.994v30h-173.661c-9.649 0-17.5 7.851-17.5 17.5v36.5c0 9.649 7.851 17.5 17.5 17.5h147.656c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5h-147.656c-1.379 0-2.5-1.122-2.5-2.5v-36.5c0-1.378 1.121-2.5 2.5-2.5h173.661v40.732c0 20.678 16.822 37.5 37.5 37.5h85.732v146.483c0 4.142 3.358 7.5 7.5 7.5zm-93.232-168.983c-12.406 0-22.5-10.093-22.5-22.5v-75.126l97.626 97.625h-75.126zm-160.164 255.018h-54c-7.995 0-14.5 6.505-14.5 14.5v54c0 7.995 6.505 14.5 14.5 14.5h54c7.995 0 14.5-6.505 14.5-14.5v-54c0-7.995-6.505-14.5-14.5-14.5zm-.5 68h-53v-53h53zm15-279.5c0-7.995-6.505-14.5-14.5-14.5h-54c-7.995 0-14.5 6.505-14.5 14.5v54c0 7.995 6.505 14.5 14.5 14.5h54c7.995 0 14.5-6.505 14.5-14.5zm-15 53.5h-53v-53h53zm203.606-68h-151.106c-4.143 0-7.5 3.358-7.5 7.5s3.357 7.5 7.5 7.5h151.106c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5zm0 30h-151.106c-4.143 0-7.5 3.358-7.5 7.5s3.357 7.5 7.5 7.5h151.106c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5zm-188.606 97.5c0-7.995-6.505-14.5-14.5-14.5h-54c-7.995 0-14.5 6.505-14.5 14.5v54c0 7.995 6.505 14.5 14.5 14.5h54c7.995 0 14.5-6.505 14.5-14.5zm-15 53.5h-53v-53h53z"
                  fill={isReportsActive ? '#ffffff' : inactiveGray}
                />
              </g>
            </svg>
          }
        />

        {/* Profile */}
        <NavItem
          href="/profile"
          isActive={isProfileActive}
          label="Profile"
          icon={
            <svg
              height="24"
              viewBox="0 0 512 512"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              <path
                d="m437.019531 74.980469c-48.351562-48.351563-112.640625-74.980469-181.019531-74.980469s-132.667969 26.628906-181.019531 74.980469c-48.351563 48.351562-74.980469 112.640625-74.980469 181.019531s26.628906 132.667969 74.980469 181.019531c48.351562 48.351563 112.640625 74.980469 181.019531 74.980469s132.667969-26.628906 181.019531-74.980469c48.351563-48.351562 74.980469-112.640625 74.980469-181.019531s-26.628906-132.667969-74.980469-181.019531zm-325.914062 354.316406c8.453125-72.734375 70.988281-128.890625 144.894531-128.890625 38.960938 0 75.597656 15.179688 103.15625 42.734375 23.28125 23.285156 37.964844 53.6875 41.742188 86.152344-39.257813 32.878906-89.804688 52.707031-144.898438 52.707031s-105.636719-19.824219-144.894531-52.703125zm144.894531-159.789063c-42.871094 0-77.753906-34.882812-77.753906-77.753906 0-42.875 34.882812-77.753906 77.753906-77.753906s77.753906 34.878906 77.753906 77.753906c0 42.871094-34.882812 77.753906-77.753906 77.753906zm170.71875 134.425782c-7.644531-30.820313-23.585938-59.238282-46.351562-82.003906-18.4375-18.4375-40.25-32.269532-64.039063-40.9375 28.597656-19.394532 47.425781-52.160157 47.425781-89.238282 0-59.414062-48.339844-107.753906-107.753906-107.753906s-107.753906 48.339844-107.753906 107.753906c0 37.097656 18.84375 69.875 47.464844 89.265625-21.886719 7.976563-42.140626 20.308594-59.566407 36.542969-25.234375 23.5-42.757812 53.464844-50.882812 86.347656-34.410157-39.667968-55.261719-91.398437-55.261719-147.910156 0-124.617188 101.382812-226 226-226s226 101.382812 226 226c0 56.523438-20.859375 108.265625-55.28125 147.933594zm0 0"
                fill={isProfileActive ? '#ffffff' : inactiveGray}
              />
            </svg>
          }
        />
      </div>
    </nav>
  );
}

