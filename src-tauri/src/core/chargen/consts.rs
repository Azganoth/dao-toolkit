use std::sync::LazyLock;

use indexmap::IndexSet;

use super::models::*;

macro_rules! index_set {
    // Handle tuples (String, String) for HairResource
    ( $( ($name:expr, $cut:expr) ),* $(,)? ) => {
        {
            let mut set = IndexSet::new();
            $(
                set.insert(HairResource {
                    name: $name.into(),
                    cut: $cut.into(),
                    path: None
                });
            )*
            set
        }
    };

    // Handle single string values for Resource
    ( $( $name:expr ),* $(,)? ) => {
        {
            let mut set = IndexSet::new();
            $(
                set.insert(Resource {
                    name: $name.into(),
                    path: None
                });
            )*
            set
        }
    };
}

pub static VANILLA_CHARGEN: LazyLock<Chargen> = LazyLock::new(|| Chargen {
    heads: RaceGroup {
        hm: index_set![
            "HM_CPS_P01.mop",
            "HM_CPS_P02.mop",
            "HM_CPS_P03.mop",
            "HM_CPS_P04.mop",
            "HM_CPS_P05.mop",
            "HM_CPS_P06.mop",
            "HM_CPS_P07.mop",
            "HM_CPS_P08.mop",
            "HM_PCC_B01.mop"
        ],
        hf: index_set![
            "HF_CPS_P01.mop",
            "HF_CPS_P02.mop",
            "HF_CPS_P03.mop",
            "HF_CPS_P04.mop",
            "HF_CPS_P05.mop",
            "HF_CPS_P06.mop",
            "HF_CPS_P07.mop",
            "HF_CPS_P08.mop",
            "HF_PCC_B01.mop"
        ],
        dm: index_set![
            "DM_CPS_P01.mop",
            "DM_CPS_P02.mop",
            "DM_CPS_P03.mop",
            "DM_CPS_P04.mop",
            "DM_CPS_P05.mop",
            "DM_CPS_P06.mop",
            "DM_CPS_P07.mop",
            "DM_CPS_P08.mop",
            "DM_PCC_B01.mop"
        ],
        df: index_set![
            "DF_CPS_P01.mop",
            "DF_CPS_P02.mop",
            "DF_CPS_P03.mop",
            "DF_CPS_P04.mop",
            "DF_CPS_P05.mop",
            "DF_CPS_P06.mop",
            "DF_CPS_P07.mop",
            "DF_CPS_P08.mop",
            "DF_PCC_B01.mop"
        ],
        em: index_set![
            "EM_CPS_P01.mop",
            "EM_CPS_P02.mop",
            "EM_CPS_P03.mop",
            "EM_CPS_P04.mop",
            "EM_CPS_P05.mop",
            "EM_CPS_P06.mop",
            "EM_CPS_P07.mop",
            "EM_CPS_P08.mop",
            "EM_PCC_B01.mop"
        ],
        ef: index_set![
            "EF_CPS_P01.mop",
            "EF_CPS_P02.mop",
            "EF_CPS_P03.mop",
            "EF_CPS_P04.mop",
            "EF_CPS_P05.mop",
            "EF_CPS_P06.mop",
            "EF_CPS_P07.mop",
            "EF_CPS_P08.mop",
            "EF_PCC_B01.mop"
        ],
    },
    hairs: RaceGroup {
        hm: index_set![
            ("hm_har_blda_0", "0234"),
            ("hm_har_ha1a_0", "1"),
            ("hm_har_ha2a_0", "1"),
            ("hm_har_ha3a_0", "1"),
            ("hm_har_hb1a_0", "1"),
            ("hm_har_hb2a_0", "1"),
            ("hm_har_hb3a_0", "1"),
            ("hm_har_hb4a_0", "1"),
            ("hm_har_hc1a_0", "1"),
            ("hm_har_hc2a_0", "1"),
            ("hm_har_hc3a_0", "1"),
            ("hm_har_hc4a_0", "1"),
            ("hm_har_hd1a_0", "1"),
            ("hm_har_hd2a_0", "1"),
            ("hm_har_hd3a_0", "1"),
            ("hm_har_hd4a_0", "0")
        ],
        hf: index_set![
            ("hf_har_blda_0", "02"),
            ("hf_har_ha1a_0", "1"),
            ("hf_har_ha2a_0", "1"),
            ("hf_har_ha3a_0", "1"),
            ("hf_har_ha4a_0", "1"),
            ("hf_har_hb1a_0", "1"),
            ("hf_har_hb2a_0", "1"),
            ("hf_har_hb3a_0", "1"),
            ("hf_har_hb4a_0", "1"),
            ("hf_har_hc1a_0", "1"),
            ("hf_har_hc2a_0", "1"),
            ("hf_har_hc3a_0", "1"),
            ("hf_har_hc4a_0", "1"),
            ("hf_har_hd1a_0", "1"),
            ("hf_har_hd2a_0", "1"),
            ("hf_har_hd3a_0", "1"),
            ("hf_har_hd4a_0", "1")
        ],
        dm: index_set![
            ("dm_har_blda_0", "0234"),
            ("dm_har_ha1a_0", "1"),
            ("dm_har_ha2a_0", "1"),
            ("dm_har_ha3a_0", "1"),
            ("dm_har_hb1a_0", "1"),
            ("dm_har_hb2a_0", "1"),
            ("dm_har_hb3a_0", "1"),
            ("dm_har_hb4a_0", "0")
        ],
        df: index_set![
            ("df_har_blda_0", "02"),
            ("df_har_ha1a_0", "1"),
            ("df_har_ha2a_0", "1"),
            ("df_har_ha3a_0", "1"),
            ("df_har_ha4a_0", "1"),
            ("df_har_hb1a_0", "1"),
            ("df_har_hb2a_0", "1"),
            ("df_har_hb3a_0", "1"),
            ("df_har_hb4a_0", "1"),
            ("df_har_hc1a_0", "1"),
            ("df_har_hc2a_0", "1"),
            ("df_har_hc3a_0", "1"),
            ("df_har_hc4a_0", "1"),
            ("df_har_hd1a_0", "1"),
            ("df_har_hd2a_0", "1"),
            ("df_har_hd3a_0", "1"),
            ("df_har_hd4a_0", "1")
        ],
        em: index_set![
            ("em_har_blda_0", "0234"),
            ("em_har_ha1a_0", "1"),
            ("em_har_ha2a_0", "1"),
            ("em_har_ha3a_0", "1"),
            ("em_har_hb1a_0", "1"),
            ("em_har_hb2a_0", "1"),
            ("em_har_hb3a_0", "1"),
            ("em_har_hb4a_0", "1"),
            ("em_har_hc1a_0", "1"),
            ("em_har_hc2a_0", "1"),
            ("em_har_hc3a_0", "1"),
            ("em_har_hc4a_0", "1"),
            ("em_har_hd1a_0", "1"),
            ("em_har_hd2a_0", "1"),
            ("em_har_hd3a_0", "1"),
            ("em_har_hd4a_0", "0")
        ],
        ef: index_set![
            ("ef_har_blda_0", "02"),
            ("ef_har_ha1a_0", "1"),
            ("ef_har_ha2a_0", "1"),
            ("ef_har_ha3a_0", "1"),
            ("ef_har_ha4a_0", "1"),
            ("ef_har_hb1a_0", "1"),
            ("ef_har_hb2a_0", "1"),
            ("ef_har_hb3a_0", "1"),
            ("ef_har_hb4a_0", "1"),
            ("ef_har_hc1a_0", "1"),
            ("ef_har_hc2a_0", "1"),
            ("ef_har_hc3a_0", "1"),
            ("ef_har_hc4a_0", "1"),
            ("ef_har_hd1a_0", "1"),
            ("ef_har_hd2a_0", "1"),
            ("ef_har_hd3a_0", "1"),
            ("ef_har_hd4a_0", "1")
        ],
    },
    beards: Race2Group {
        hm: index_set![
            "",
            "hm_brd_b1a_0",
            "hm_brd_b2a_0",
            "hm_brd_b3a_0",
            "hm_brd_b4a_0",
            "hm_brd_b5a_0",
            "hm_brd_b6a_0"
        ],
        dm: index_set![
            "",
            "dm_brd_b1a_0",
            "dm_brd_b2a_0",
            "dm_brd_b3a_0",
            "dm_brd_b4a_0",
            "dm_brd_b5a_0",
            "dm_brd_b6a_0"
        ],
    },
    tints: TintGroup {
        hair: index_set![
            "t3_har_wht",
            "t3_har_bln",
            "t3_har_dbl",
            "t3_har_org",
            "t3_har_red",
            "t3_har_lbr",
            "t3_har_rbr",
            "t3_har_dbr",
            "t3_har_blk"
        ],
        skin: index_set![
            "t1_skn_001",
            "t1_skn_002",
            "t1_skn_003",
            "t1_skn_004",
            "t1_skn_006",
            "t1_skn_005",
            "t1_skn_007"
        ],
        eye: index_set![
            "t3_eye_ice",
            "t3_eye_lbl",
            "t3_eye_dbl",
            "t3_eye_tea",
            "t3_eye_grn",
            "t3_eye_hzl",
            "t3_eye_lbr",
            "t3_eye_amb",
            "t3_eye_dbr",
            "t3_eye_gry",
            "t3_eye_blk"
        ],
        eye_makeup: index_set![
            "",
            "t1_mue_bl1",
            "t1_mue_bl2",
            "t1_mue_bl3",
            "t1_mue_gn1",
            "t1_mue_gn2",
            "t1_mue_gn3",
            "t1_mue_gr1",
            "t1_mue_gr2",
            "t1_mue_gr3",
            "t1_mue_or1",
            "t1_mue_or2",
            "t1_mue_or3",
            "t1_mue_pi1",
            "t1_mue_pi2",
            "t1_mue_pi3",
            "t1_mue_pu1",
            "t1_mue_pu2",
            "t1_mue_pu3",
            "t1_mue_re1",
            "t1_mue_re2",
            "t1_mue_re3",
            "t1_mue_ro1",
            "t1_mue_ro2",
            "t1_mue_ro3",
            "t1_mue_te1",
            "t1_mue_te2",
            "t1_mue_te3",
            "t1_mue_ye1",
            "t1_mue_ye2",
            "t1_mue_ye3"
        ],
        blush_makeup: index_set![
            "",
            "t1_mub_br1",
            "t1_mub_br2",
            "t1_mub_br3",
            "t1_mub_or1",
            "t1_mub_or2",
            "t1_mub_or3",
            "t1_mub_pi1",
            "t1_mub_pi2",
            "t1_mub_pi3",
            "t1_mub_pu1",
            "t1_mub_pu2",
            "t1_mub_pu3",
            "t1_mub_re1",
            "t1_mub_re2",
            "t1_mub_re3",
            "t1_mub_ro1",
            "t1_mub_ro2",
            "t1_mub_ro3",
            "t1_mub_ta1",
            "t1_mub_ta2",
            "t1_mub_ta3",
            "t1_mub_te1",
            "t1_mub_te2",
            "t1_mub_te3"
        ],
        lip_makeup: index_set![
            "",
            "t1_mul_bk1",
            "t1_mul_bk2",
            "t1_mul_bk3",
            "t1_mul_br1",
            "t1_mul_br2",
            "t1_mul_br3",
            "t1_mul_pi1",
            "t1_mul_pi2",
            "t1_mul_pi3",
            "t1_mul_pu1",
            "t1_mul_pu2",
            "t1_mul_pu3",
            "t1_mul_re1",
            "t1_mul_re2",
            "t1_mul_re3",
            "t1_mul_ro1",
            "t1_mul_ro2",
            "t1_mul_ro3",
            "t1_mul_ta1",
            "t1_mul_ta2",
            "t1_mul_ta3",
            "t1_mul_te1",
            "t1_mul_te2",
            "t1_mul_te3"
        ],
        brow: index_set![
            "t1_stb_wht",
            "t1_stb_bln",
            "t1_stb_dbl",
            "t1_stb_org",
            "t1_stb_red",
            "t1_stb_lbr",
            "t1_stb_rbr",
            "t1_stb_dbr",
            "t1_stb_blk"
        ],
        tattoo: index_set![
            "t1_tat_blk",
            "t1_tat_gry",
            "t1_tat_brn",
            "t1_tat_dbr",
            "t1_tat_grn",
            "t1_tat_dgn",
            "t1_tat_blu",
            "t1_tat_dbl",
            "t1_tat_pur",
            "t1_tat_dpu",
            "t1_tat_red",
            "t1_tat_drd",
            "t1_tat_org",
            "t1_tat_yel",
            "t1_tat_pnk"
        ],
    },
    textures: TextureGroup {
        skin: index_set![
            "uh_hed_fema_0d",
            "uh_hed_elfa_0d",
            "uh_hed_kida_0d",
            "uh_hed_masa_0d",
            "uh_hed_dwfa_0d",
            "uh_hed_quna_0d"
        ],
        tattoo: index_set![
            "uh_tat_av1_0t",
            "uh_tat_av2_0t",
            "uh_tat_av3_0t",
            "uh_tat_da1_0t",
            "uh_tat_da2_0t",
            "uh_tat_da3_0t",
            "uh_tat_dw1_0t",
            "uh_tat_dw2_0t",
            "uh_tat_p01_0t"
        ],
    },
});
