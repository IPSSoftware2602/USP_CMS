const customStyles = {
    headRow: {
        style: {
            backgroundColor: '#312e81',
            color: 'white',
            minHeight: '50px',
            fontSize: '16px',
            justifyContent: 'center',
        },
    },
    headCells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
            fontWeight: '500',
            justifyContent: 'center',
            textAlign: 'center',
            subHeaderWrap: true,
        },
    },
    rows: {
        style: {
            minHeight: '60px',
            fontSize: '15px',
            '&:hover': {
                backgroundColor: '#f9fafb',
            },
            justifyContent: 'center',
            center: true,
        },
        highlightOnHoverStyle: {
            backgroundColor: '#f9fafb',
        },
    },
    cells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
            justifyContent: 'center',
            textAlign: 'center',
            alignItems: 'center',
            center: true,
        },
    },
    pagination: {
        style: {
            borderTopStyle: 'solid',
            borderTopWidth: '1px',
            borderTopColor: '#e5e7eb',
        },
    },
};

export default customStyles;