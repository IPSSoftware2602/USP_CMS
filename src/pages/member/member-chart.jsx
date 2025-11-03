import { useState, useEffect, useRef } from 'react';
import OrganizationChart from "organization-chart-react";
import "organization-chart-react/dist/style.css";
import { useNavigate } from 'react-router-dom';

const orgData = {
  title: "CEO",
  titleClass: "title-box",
  contentClass: "rounded-lg text-center p-3",
  member: [
    {
      name: "Oliver",
      add: "View Order",
    },
  ],
  children: [
    {
      title: "MANAGEMENT",
      titleClass: "title-box",
      contentClass: "rounded-lg text-center p-3",
      member: [
        {
          name: "Jake",
          add: "View Order",
        },
      ],
      children: [
        {
          title: "FRONTEND",
          titleClass: "title-box",
          contentClass: "rounded-lg text-center p-3",
          member: [
            {
              name: "David",
              add: "View Order",
            },
          ],
        },
      ],
    },
    {
      title: "DEVELOPMENT",
      titleClass: "title-box",
      contentClass: "rounded-lg text-center p-3",
      member: [
        {
          name: "Emma",
          add: "View Order",
        },
      ],
    },
    {
      title: "DEVELOPMENT",
      titleClass: "title-box",
      contentClass: "rounded-lg text-center p-3",
      member: [
        {
          name: "Nick",
          add: "View Order",
        },
      ],
    },
  ],
};

const OrgChart = () => {
  const [zoom, setZoom] = useState(0.7);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef(null);

  const customCSS = `
    .org-chart-container {
      font-family: Arial, sans-serif;
    }

    .org-extend-arrow {
       width: 30px;
       height: 30px;
    }

    .title-box {
      display: none;
    }
  `;


  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prevZoom => {
      const newZoom = prevZoom * zoomFactor;
      return Math.min(Math.max(newZoom, 0.5), 2);
    });
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const navigate = useNavigate();
  const handleOrder = () => {
    navigate('/member/member_overview/member_order');
  }


  return (
    <div className="w-full h-full flex flex-col shadow-md">
      <div className="w-full bg-indigo-900 text-white p-4 font-bold rounded-t-md">
        Organization Chart
      </div>

      <style>{customCSS}</style>

      <div
        ref={chartContainerRef}
        className="w-full flex-grow bg-gray-50 overflow-hidden rounded-b-md"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
        >
          <OrganizationChart
            data={orgData}
            onClickNode={handleOrder}
          />
        </div>
      </div>
    </div>
  );
};

export default OrgChart;